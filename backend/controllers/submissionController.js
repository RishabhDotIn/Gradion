const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const { getGeminiConfig, formatGeminiApiError } = require('../config/geminiEnv');

function parseJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function geminiJsonPrompt(apiKey, modelName, promptText) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(promptText);
  const text = result.response.text();
  return parseJsonFromText(text);
}

function mentionsComplexity(text) {
  if (!text) return false;
  const s = String(text).toLowerCase();
  const keywords = [
    'time complexity',
    'space complexity',
    'big-o',
    'big o',
    'complexity',
    'inefficient',
    'timeout',
    'performance',
    'optimi', // covers optimize/optimization/optimal
  ];
  return keywords.some((k) => s.includes(k));
}

function mentionsSyntaxError(text) {
  if (!text) return false;
  const s = String(text).toLowerCase();
  const keywords = [
    'syntax error',
    'unexpected token',
    'compilation error',
    'compile error',
    'parse error',
    'missing semicolon',
    "missing ';'",
    'cannot find symbol',
    'unterminated',
    'expected',
    'error:',
  ];
  return keywords.some((k) => s.includes(k));
}

async function loadAssignmentForStudent(studentId, assignmentId) {
  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) return { error: { status: 404, message: 'Assignment not found' } };
  const enrolled = await Class.exists({
    _id: assignment.classId,
    students: new mongoose.Types.ObjectId(studentId),
  });
  if (!enrolled) {
    return { error: { status: 403, message: 'You must join the class for this assignment before submitting' } };
  }
  return { assignment };
}

const runSubmission = async (req, res) => {
  try {
    const { assignmentId, code, language, questionIndex = 0 } = req.body;
    if (!assignmentId || code === undefined || code === null) {
      return res.status(400).json({ success: false, message: 'assignmentId and code are required' });
    }
    const studentId = req.user.userId;
    const qIdx = Math.max(0, parseInt(questionIndex, 10) || 0);

    const { assignment, error } = await loadAssignmentForStudent(studentId, assignmentId);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const question = assignment.questions && assignment.questions[qIdx];
    if (!question) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }
    const testCases = question.testCases || [];
    const { apiKey, modelName } = getGeminiConfig();

    if (!apiKey) {
      return res.json({
        success: true,
        run: {
          verdict: 'Unknown',
          output: 'Set GEMINI_API_KEY on the server to enable AI run output.',
          perTest: [],
          summary: '',
        },
      });
    }

    const runPrompt = `You simulate executing a student's program against test cases (you cannot run code; reason step by step).

  Language: ${language || question.language || 'unknown'}
  Problem: ${question.problemTitle || ''}
  Description: ${(question.problemDescription || '').slice(0, 2000)}
  Constraints (only enforce what is written here): ${(question.constraints || '').slice(0, 1500)}
  Test cases (input -> expected output):
  ${JSON.stringify(testCases, null, 2)}

  Student code:
  """
  ${String(code).slice(0, 12000)}
  """

  Grading rules (important):
  - Only consider two types of failures for pass/fail: (1) syntax/compilation errors that make the code non-runnable (for compiled languages pay special attention to missing semicolons, unmatched braces, missing parentheses, incorrect method signatures, or other compile-time issues), or (2) incorrect outputs for the provided test cases. You MUST NOT use time/space complexity, algorithmic optimality, style, or performance as criteria for pass/fail unless the Constraints string above explicitly states a complexity requirement.
  - For each test case, set pass=true if the student's program would produce an output that matches the expected output for that input (formatting must match the problem's expectation).
  - Set verdict "Passed" if all test cases pass; "Partial" if some pass; "Failed" if at least one test case would produce an incorrect output; set verdict "Error" if the code appears to have a syntax or parsing error that prevents execution (explain briefly in the output).
  - You may include optional hints about potential optimizations in the output, but they must NOT affect the verdict.

  Return ONLY valid JSON (no markdown) with this shape:
  {"verdict":"Passed"|"Failed"|"Partial"|"Error","output":"multi-line string: simulated stdout / reasoning trace for each case (or syntax error details)","perTest":[{"caseIndex":number,"pass":boolean,"input":string,"expected":string,"actualOrNote":string}],"summary":"one line human summary"}`;

    let runJson = {
      verdict: 'Unknown',
      output: 'Could not parse AI response.',
      perTest: [],
      summary: '',
    };
    try {
      const r = await geminiJsonPrompt(apiKey, modelName, runPrompt);
        if (r && typeof r === 'object') {
        runJson = {
          verdict: ['Passed', 'Failed', 'Partial'].includes(r.verdict) ? r.verdict : 'Unknown',
          output: typeof r.output === 'string' ? r.output : String(r.output || ''),
          perTest: Array.isArray(r.perTest) ? r.perTest : [],
          summary: typeof r.summary === 'string' ? r.summary : '',
        };
        const pt = runJson.perTest;
        if (Array.isArray(pt) && pt.length > 0 && pt.every((row) => row.pass === true)) {
          runJson.verdict = 'Passed';
        }
        // If the AI marked the run as Failed but the trace only mentions complexity/performance,
        // downgrade to Partial because we cannot execute code here and complexity should not
        // block a functional correctness verdict unless explicitly required in constraints.
        if (runJson.verdict === 'Failed' && mentionsComplexity(runJson.output)) {
          runJson.verdict = 'Partial';
          runJson.output = `${runJson.output}\n\n[Note: verdict downgraded to Partial — failure appeared to be based on complexity/performance analysis which is not enforced unless explicitly required.]`;
        }
        // If AI output indicates a syntax/compilation error, enforce Error verdict.
        if (mentionsSyntaxError(runJson.output)) {
          runJson.verdict = 'Error';
          // normalize message
          runJson.output = `${runJson.output}\n\n[Note: syntax/compilation error detected and marked as Error]`;
        }
      }
    } catch (err) {
      runJson.output = `Run analysis error: ${formatGeminiApiError(err)}`;
    }

    return res.json({ success: true, run: runJson });
  } catch (error) {
    console.error('runSubmission error:', error);
    return res.status(500).json({ success: false, message: 'Run failed', error: error.message });
  }
};

const createSubmission = async (req, res) => {
  try {
    const { assignmentId, code, language, questionIndex = 0 } = req.body;
    if (!assignmentId || code === undefined || code === null) {
      return res.status(400).json({ success: false, message: 'assignmentId and code are required' });
    }

    const studentId = req.user.userId;
    const qIdx = Math.max(0, parseInt(questionIndex, 10) || 0);

    const { assignment, error } = await loadAssignmentForStudent(studentId, assignmentId);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const question = assignment.questions && assignment.questions[qIdx];
    if (!question) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    const testCases = question.testCases || [];
    const { apiKey, modelName } = getGeminiConfig();

    let evalJson = { status: 'Failed', score: 0, feedback: 'Automatic evaluation could not be completed.' };
    let plagiarismJson = { plagiarismScore: 0, explanation: '' };

    if (!apiKey) {
      evalJson = {
        status: 'Failed',
        score: 0,
        feedback: 'Server is missing GEMINI_API_KEY. Configure the key to enable AI grading.',
      };
    } else {
        const evalPrompt = `You are an automated programming assignment grader. You cannot execute code; reason about the solution against the stated tests.

    Assignment language: ${language || question.language || 'unknown'}
    Problem title: ${question.problemTitle || ''}
    Problem description: ${question.problemDescription || ''}
    Constraints (only enforce requirements stated here): ${question.constraints || ''}
    Official test cases (input -> expected output):
    ${JSON.stringify(testCases, null, 2)}

    Student submitted code:
    """
    ${code}
    """

    Return ONLY valid JSON (no markdown) with this exact shape:
    {"status":"Passed"|"Failed"|"Partial"|"Error","score":number from 0-100,"feedback":"string with concise constructive hints; do not give the full correct solution"}

    Rules:
    - Base the status solely on (A) whether the code has syntax/parse/compilation errors that prevent execution (for compiled languages check for missing semicolons, unmatched braces, missing parentheses, incorrect signatures, etc.), and (B) whether it would produce correct outputs for the official test cases. Do NOT use time/space complexity, algorithmic optimality, or style as criteria for pass/fail unless the assignment Constraints explicitly require a complexity bound.
    - If the code has syntax or parsing errors that prevent execution, return status "Error", set score to 0, and include a short explanation in feedback that names the likely compile/parse error.
    - "Passed" should be used when the solution would produce correct outputs for the official test cases (score typically 85-100). "Partial" when some but not all official test cases would pass. "Failed" when the logic would clearly produce wrong answers on at least one official test case.
    - You may mention potential optimizations in feedback, but they must NOT affect the status.
    - feedback must be concise, constructive, and must NOT include a complete ready-to-submit solution.`;

      const peerSnippets = await Submission.find({
        assignment: assignment._id,
        student: { $ne: new mongoose.Types.ObjectId(studentId) },
        questionIndex: qIdx,
      })
        .select('code')
        .limit(20)
        .lean();

      const plagiarismPrompt = `You estimate code similarity for academic integrity (no execution).

Student code A (submission):
"""
${code}
"""

Other student submissions for the same question (may be empty):
${peerSnippets.length ? peerSnippets.map((s, i) => `--- Snippet ${i + 1} ---\n${(s.code || '').slice(0, 4000)}`).join('\n\n') : '(none — compare against common textbook patterns only if relevant)'}

Return ONLY valid JSON (no markdown):
{"plagiarismScore": number from 0-100 where 100 means essentially identical or clearly copied,"explanation":"one short paragraph"}`;

      try {
        const e = await geminiJsonPrompt(apiKey, modelName, evalPrompt);
        if (e && typeof e.score === 'number') {
          evalJson = {
            status: e.status === 'Passed' ? 'Passed' : e.status === 'Error' ? 'Failed' : 'Failed',
            score: Math.min(100, Math.max(0, Math.round(e.score))),
            feedback: typeof e.feedback === 'string' ? e.feedback : evalJson.feedback,
          };
        }
        // If AI feedback indicates a syntax/compilation error, enforce Error status and zero score.
        if (mentionsSyntaxError(evalJson.feedback) || (e && e.status === 'Error')) {
          evalJson.status = 'Failed';
          evalJson.score = 0;
          evalJson.feedback = `${evalJson.feedback}\n\n[Marked as Error: syntax/compilation issue detected]`;
        }
        // If AI failed the submission but feedback mentions complexity/performance, do not
        // treat it as a hard failure. Convert to Partial and ensure a reasonable minimum score.
        if (evalJson.status === 'Failed' && mentionsComplexity(evalJson.feedback)) {
          evalJson.status = 'Partial';
          evalJson.score = Math.max(evalJson.score || 0, 60);
          evalJson.feedback = `${evalJson.feedback}\n\n[Note: evaluation status changed to Partial because the AI cited complexity/performance concerns. Complexity is not enforced unless explicitly required in the problem constraints.]`;
        }
      } catch (err) {
        console.error('Gemini evaluation error:', err.message);
        evalJson.feedback = `AI evaluation error: ${formatGeminiApiError(err)}`;
      }

      try {
        const p = await geminiJsonPrompt(apiKey, modelName, plagiarismPrompt);
        if (p && typeof p.plagiarismScore === 'number') {
          plagiarismJson = {
            plagiarismScore: Math.min(100, Math.max(0, Math.round(p.plagiarismScore))),
            explanation: typeof p.explanation === 'string' ? p.explanation : '',
          };
        }
      } catch (err) {
        console.error('Gemini plagiarism error:', err.message);
        plagiarismJson.explanation = `Plagiarism check error: ${formatGeminiApiError(err)}`;
      }
    }

    const submittedAt = new Date();
    const late = submittedAt > new Date(assignment.deadline);

    let status = 'Graded';
    if (evalJson.status === 'Failed') {
      status = 'Failed';
    } else if (evalJson.status === 'Passed' && late) {
      status = 'Late';
    }

    const payload = {
      student: studentId,
      assignment: assignment._id,
      questionIndex: qIdx,
      code,
      language: language || question.language || '',
      status,
      score: evalJson.score,
      aiFeedback: evalJson.feedback || '',
      plagiarismScore: plagiarismJson.plagiarismScore,
      plagiarismExplanation: plagiarismJson.explanation || '',
      submittedAt,
    };

    const updated = await Submission.findOneAndUpdate(
      { student: studentId, assignment: assignment._id, questionIndex: qIdx },
      { $set: payload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      submission: updated,
      evaluation: {
        aiStatus: evalJson.status,
        score: evalJson.score,
        feedback: evalJson.feedback,
        plagiarismScore: plagiarismJson.plagiarismScore,
        plagiarismExplanation: plagiarismJson.explanation,
        late,
      },
    });
  } catch (error) {
    console.error('createSubmission error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process submission', error: error.message });
  }
};

const getTeacherSubmissions = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const assignmentIds = (await Assignment.find({ teacher: teacherId }).select('_id')).map((a) => a._id);
    const filter = { assignment: { $in: assignmentIds } };

    if (req.query.assignmentId && mongoose.Types.ObjectId.isValid(req.query.assignmentId)) {
      const owns = await Assignment.exists({ _id: req.query.assignmentId, teacher: teacherId });
      if (owns) filter.assignment = req.query.assignmentId;
    }
    if (req.query.status && ['Pending', 'Graded', 'Late', 'Failed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [total, submissions] = await Promise.all([
      Submission.countDocuments(filter),
      Submission.find(filter)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('student', 'fullName email')
        .populate({
          path: 'assignment',
          select: 'title classId deadline',
          populate: { path: 'classId', select: 'name' },
        })
        .lean(),
    ]);

    return res.json({
      success: true,
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('getTeacherSubmissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load submissions' });
  }
};

const getStudentSubmissions = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const filter = { student: studentId };
    if (req.query.assignmentId && mongoose.Types.ObjectId.isValid(req.query.assignmentId)) {
      filter.assignment = req.query.assignmentId;
    }

    const submissions = await Submission.find(filter)
      .sort({ submittedAt: -1 })
      .populate({ path: 'assignment', select: 'title topic deadline classId', populate: { path: 'classId', select: 'name' } })
      .lean();

    return res.json({ success: true, submissions });
  } catch (error) {
    console.error('getStudentSubmissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load submissions' });
  }
};

const getStudentSubmissionById = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const sub = await Submission.findOne({
      _id: req.params.id,
      student: studentId,
    })
      .populate({ path: 'assignment', select: 'title topic description difficulty deadline questions classId', populate: { path: 'classId', select: 'name' } })
      .lean();

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    return res.json({ success: true, submission: sub });
  } catch (error) {
    console.error('getStudentSubmissionById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load submission' });
  }
};

const patchTeacherSubmission = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const submission = await Submission.findById(req.params.id).populate({
      path: 'assignment',
      select: 'teacher',
    });

    if (!submission || !submission.assignment || submission.assignment.teacher.toString() !== teacherId) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const { score, status, teacherFeedback } = req.body;
    if (score !== undefined) {
      const n = Number(score);
      if (!Number.isNaN(n)) submission.score = Math.min(100, Math.max(0, n));
    }
    if (status && ['Pending', 'Graded', 'Late', 'Failed'].includes(status)) {
      submission.status = status;
    }
    if (teacherFeedback !== undefined) {
      submission.teacherFeedback = String(teacherFeedback);
    }

    await submission.save();
    return res.json({ success: true, submission });
  } catch (error) {
    console.error('patchTeacherSubmission error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update submission' });
  }
};

module.exports = {
  runSubmission,
  createSubmission,
  getTeacherSubmissions,
  getStudentSubmissions,
  getStudentSubmissionById,
  patchTeacherSubmission,
};
