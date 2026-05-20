const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getGeminiConfig, formatGeminiApiError } = require('../config/geminiEnv');
const { coerceQuestionsInput } = require('../utils/assignmentQuestions');

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
    const arrStart = t.indexOf('[');
    const arrEnd = t.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      try {
        return JSON.parse(t.slice(arrStart, arrEnd + 1));
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
  return parseJsonFromText(result.response.text());
}

const ALLOWED_LANGS = new Set(['java', 'python', 'cpp', 'javascript', 'plaintext']);

function sanitizeLanguage(language) {
  const lang = String(language || '').trim().toLowerCase();
  return ALLOWED_LANGS.has(lang) ? lang : 'javascript';
}

function languageStarterCode(language, title = 'solve') {
  switch (sanitizeLanguage(language)) {
    case 'python':
      return `def ${title.replace(/\W+/g, '_').toLowerCase()}():\n    # TODO: implement solution\n    pass\n`;
    case 'java':
      return `public class Solution {\n    public static void main(String[] args) {\n        // TODO: implement solution\n    }\n}\n`;
    case 'cpp':
      return `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // TODO: implement solution\n    return 0;\n}\n`;
    case 'plaintext':
      return '';
    default:
      return `function ${title.replace(/\W+/g, '_').toLowerCase()}() {\n  // TODO: implement solution\n}\n`;
  }
}

function normalizeQuestion(question, fallbackLanguage) {
  const coerced = coerceQuestionsInput([question])[0] || {};
  const language = sanitizeLanguage(coerced.language || fallbackLanguage);
  const starterCode = String(coerced.starterCode || '').trim() || languageStarterCode(language, coerced.problemTitle || 'solve');
  const testCases = Array.isArray(coerced.testCases) && coerced.testCases.length > 0
    ? coerced.testCases
        .map((tc) => ({ input: String(tc?.input || '').trim(), output: String(tc?.output || '').trim() }))
        .filter((tc) => tc.input || tc.output)
    : [];

  return {
    problemTitle: String(coerced.problemTitle || 'Untitled Question').trim(),
    problemDescription: String(coerced.problemDescription || '').trim() || String(coerced.examples || '').trim() || 'Describe the problem requirements here.',
    constraints: String(coerced.constraints || '').trim(),
    examples: String(coerced.examples || '').trim(),
    language,
    starterCode,
    testCases: testCases.length > 0 ? testCases : [{ input: '', output: '' }],
  };
}

function cleanTopicText(value) {
  return String(value || '').trim();
}

function inferSuggestedTopic(payload) {
  const providedTopic = cleanTopicText(payload.topic);
  if (providedTopic) return providedTopic;

  const fromTitle = cleanTopicText(payload.title);
  if (fromTitle) return fromTitle.replace(/assignment|project|task/gi, '').replace(/\s+/g, ' ').trim() || fromTitle;

  const fromClass = cleanTopicText(payload.className);
  if (fromClass) return `${fromClass} Practice`;

  const fromDescription = cleanTopicText(payload.description);
  if (fromDescription) {
    const words = fromDescription.split(/\s+/).slice(0, 4).join(' ');
    return words ? `${words}${fromDescription.split(/\s+/).length > 4 ? '...' : ''}` : 'Programming Practice';
  }

  return 'Programming Practice';
}

function fallbackFromTopic(payload) {
  const topic = inferSuggestedTopic(payload);
  const difficulty = String(payload.difficulty || 'medium').trim();
  const language = sanitizeLanguage(payload.language);
  const numQuestions = Math.min(Math.max(parseInt(payload.numQuestions, 10) || 1, 1), 20);
  const topicLabel = topic
    .split(/[-_]/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    questions: Array.from({ length: numQuestions }, (_, index) => {
      const n = index + 1;
      return normalizeQuestion(
        {
          problemTitle: `${topicLabel} Challenge ${n}`,
          problemDescription: `Create a ${difficulty} level coding problem about ${topicLabel}. Write a solution that demonstrates clear reasoning and handles edge cases.`,
          constraints: 'Add constraints that match the selected difficulty and topic.',
          examples: `Input: sample-${n}\nOutput: sample-result-${n}`,
          language,
          starterCode: languageStarterCode(language, `${topicLabel} ${n}`),
          testCases: [
            { input: `sample input ${n}`, output: `sample output ${n}` },
            { input: `edge case ${n}`, output: `edge output ${n}` },
          ],
        },
        language
      );
    }),
    suggestedTopic: topic,
  };
}

function buildTopicPrompt(payload) {
  const topic = cleanTopicText(payload.topic);
  const difficulty = String(payload.difficulty || 'medium').trim();
  const language = sanitizeLanguage(payload.language);
  const numQuestions = Math.min(Math.max(parseInt(payload.numQuestions, 10) || 1, 1), 20);
  const topicInstruction = topic
    ? `Use the provided topic: ${topic}.`
    : `The teacher did not provide a topic, so infer a concise suggestedTopic from the class, title, and description.`;

  return `You are a senior programming assignment writer for teachers.

Return ONLY valid JSON, no markdown, no explanation.

Generate exactly ${numQuestions} distinct coding questions for:
- Topic: ${topic || 'not provided'}
- Difficulty: ${difficulty}
- Language: ${language}

${topicInstruction}

Return one JSON object with this schema:
{
  "suggestedTopic": string,
  "questions": [
    {
      "problemTitle": string,
      "problemDescription": string,
      "constraints": string,
      "examples": string,
      "language": "java" | "python" | "cpp" | "javascript" | "plaintext",
      "starterCode": string,
      "testCases": [{ "input": string, "output": string }]
    }
  ]
}

Each question in the questions array must follow this schema:
{
  "problemTitle": string,
  "problemDescription": string,
  "constraints": string,
  "examples": string,
  "language": "java" | "python" | "cpp" | "javascript" | "plaintext",
  "starterCode": string,
  "testCases": [{ "input": string, "output": string }]
}

Rules:
- Keep every question distinct.
- Make the problem description classroom-friendly and clear.
- Include 2 to 4 test cases per question.
- Ensure each test case has both input and output.
- If starterCode is provided, it should be a valid starter template for the selected language.
- If a question uses plaintext, leave starterCode empty.
- Avoid unsupported file uploads, hidden metadata, or non-deterministic outputs.`;
}

function buildEnhancePrompt(payload) {
  const language = sanitizeLanguage(payload.language);
  const draft = payload.question || payload.seedQuestion || {};
  const seed = normalizeQuestion(draft, language);

  return `You are improving a teacher-written assignment question.

Return ONLY valid JSON, no markdown, no explanation.

Improve this question while keeping the same intended topic and difficulty.

Target language: ${language}

Input question:
${JSON.stringify(seed, null, 2)}

Goals:
- Rewrite the title and description for clarity.
- Add or improve constraints.
- Add 2 to 4 clear examples.
- Complete or improve starterCode if it is missing or weak.
- Add 2 to 4 deterministic test cases with input and output.

Return one object with this schema:
{
  "problemTitle": string,
  "problemDescription": string,
  "constraints": string,
  "examples": string,
  "language": "java" | "python" | "cpp" | "javascript" | "plaintext",
  "starterCode": string,
  "testCases": [{ "input": string, "output": string }]
}`;
}

function normalizeTopicResponse(raw, fallbackLanguage, fallbackCount = 1) {
  if (Array.isArray(raw)) {
    return {
      suggestedTopic: '',
      questions: raw.slice(0, fallbackCount).map((item) => normalizeQuestion(item, fallbackLanguage)),
    };
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.questions)) {
      return {
        suggestedTopic: cleanTopicText(raw.suggestedTopic || raw.topic),
        questions: raw.questions.slice(0, fallbackCount).map((item) => normalizeQuestion(item, fallbackLanguage)),
      };
    }
    return {
      suggestedTopic: cleanTopicText(raw.suggestedTopic || raw.topic),
      questions: [normalizeQuestion(raw, fallbackLanguage)],
    };
  }
  return { suggestedTopic: '', questions: [] };
}

function normalizeAiResponse(raw, fallbackLanguage, fallbackCount = 1) {
  const normalized = normalizeTopicResponse(raw, fallbackLanguage, fallbackCount);
  return normalized.questions || [];
}

async function generateAssignmentQuestions(req, res) {
  try {
    const mode = String(req.body.mode || 'topic').trim();
    const { apiKey, modelName } = getGeminiConfig();
    const payload = req.body || {};

    if (mode === 'enhance') {
      const enhancedSeed = payload.question || payload.seedQuestion || payload;
      const fallbackLanguage = sanitizeLanguage(payload.language || enhancedSeed?.language);

      if (!apiKey) {
        return res.json({
          success: true,
          mode,
          question: normalizeQuestion(enhancedSeed, fallbackLanguage),
          source: 'fallback',
        });
      }

      const prompt = buildEnhancePrompt({ ...payload, question: enhancedSeed, language: fallbackLanguage });
      const raw = await geminiJsonPrompt(apiKey, modelName, prompt);
      const question = normalizeAiResponse(raw, fallbackLanguage, 1)[0] || normalizeQuestion(enhancedSeed, fallbackLanguage);

      return res.json({
        success: true,
        mode,
        question,
        source: 'gemini',
      });
    }

    const numQuestions = Math.min(Math.max(parseInt(payload.numQuestions, 10) || 1, 1), 20);
    const fallbackLanguage = sanitizeLanguage(payload.language);

    if (!apiKey) {
      const fallback = fallbackFromTopic({ ...payload, numQuestions, language: fallbackLanguage });
      return res.json({
        success: true,
        mode: 'topic',
        questions: fallback.questions,
        suggestedTopic: fallback.suggestedTopic,
        source: 'fallback',
      });
    }

    const prompt = buildTopicPrompt({ ...payload, numQuestions, language: fallbackLanguage });
    const raw = await geminiJsonPrompt(apiKey, modelName, prompt);
    const normalized = normalizeTopicResponse(raw, fallbackLanguage, numQuestions);
    const suggestedTopic = normalized.suggestedTopic || inferSuggestedTopic(payload);
    const questions = normalized.questions;

    if (!questions.length) {
      const fallback = fallbackFromTopic({ ...payload, numQuestions, language: fallbackLanguage });
      return res.json({
        success: true,
        mode: 'topic',
        questions: fallback.questions,
        suggestedTopic: fallback.suggestedTopic,
        source: 'fallback',
      });
    }

    return res.json({
      success: true,
      mode: 'topic',
      questions: questions.slice(0, numQuestions),
      suggestedTopic,
      source: 'gemini',
    });
  } catch (error) {
    const mode = String(req.body.mode || 'topic').trim();
    const payload = req.body || {};
    const fallbackLanguage = sanitizeLanguage(payload.language || payload?.question?.language || payload?.seedQuestion?.language);

    if (mode === 'enhance') {
      const enhancedSeed = payload.question || payload.seedQuestion || payload;
      return res.json({
        success: true,
        mode,
        question: normalizeQuestion(enhancedSeed, fallbackLanguage),
        source: 'fallback',
        warning: formatGeminiApiError(error),
      });
    }

    const numQuestions = Math.min(Math.max(parseInt(payload.numQuestions, 10) || 1, 1), 20);
    const fallback = fallbackFromTopic({ ...payload, numQuestions, language: fallbackLanguage });
    return res.json({
      success: true,
      mode: 'topic',
      questions: fallback.questions,
      suggestedTopic: fallback.suggestedTopic,
      source: 'fallback',
      warning: formatGeminiApiError(error),
    });
  }
}

module.exports = {
  generateAssignmentQuestions,
};