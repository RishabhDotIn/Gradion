import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import "../styles/teacherDashboard.css";
import "../styles/createAssignment.css";

function validateQuestionsForSave(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "Add at least one question.";
  }
  for (let idx = 0; idx < questions.length; idx += 1) {
    const q = questions[idx];
    const title = String(q.problemTitle || "").trim();
    const desc = String(q.problemDescription || "").trim();
    const ex = String(q.examples || "").trim();
    const lang = String(q.language || "").trim();
    const hasCase = (q.testCases || []).some(
      (tc) => String(tc?.input || "").trim() && String(tc?.output || "").trim()
    );
    if (!title) return `Question ${idx + 1}: enter a problem title.`;
    if (desc.length < 5 && ex.length < 5) {
      return `Question ${idx + 1}: enter a problem description (5+ characters) or fill the examples field.`;
    }
    if (!lang) return `Question ${idx + 1}: select a language.`;
    if (!hasCase) return `Question ${idx + 1}: add at least one test case with input and output.`;
  }
  return null;
}

function normalizeQuestionsFromApi(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q) => ({
    problemTitle: q.problemTitle ?? q.title ?? "",
    problemDescription: q.problemDescription ?? q.description ?? "",
    constraints: q.constraints ?? "",
    examples: q.examples ?? "",
    language: q.language ?? "",
    starterCode: q.starterCode ?? "",
    testCases:
      Array.isArray(q.testCases) && q.testCases.length > 0
        ? q.testCases.map((tc) => ({ input: tc.input ?? "", output: tc.output ?? "" }))
        : [{ input: "", output: "" }],
  }));
}

function CreateAssignmentPage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [assignmentLanguage, setAssignmentLanguage] = useState("");
  const [deadline, setDeadline] = useState("");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [aiMode, setAiMode] = useState("manual");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  // Helper to create a new empty question
  const createEmptyQuestion = () => ({
    problemTitle: "",
    problemDescription: "",
    constraints: "",
    examples: "",
    language: assignmentLanguage,
    starterCode: "",
    testCases: [{ input: "", output: "" }]
  });
  const [numQuestionsInput, setNumQuestionsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get("edit");

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }, []);

  const selectedClassName = useMemo(() => {
    const c = classes.find((x) => String(x._id) === String(classId));
    return c ? c.name : "";
  }, [classes, classId]);

  const handleAssignmentLanguageChange = (value) => {
    setAssignmentLanguage(value);
    setQuestions((prev) => prev.map((item) => ({ ...item, language: value })));
  };

  useEffect(() => {
    const loadClasses = async () => {
      setClassesLoading(true);
      try {
        const data = await apiCall(API_CONFIG.ENDPOINTS.CLASSES_TEACHER);
        setClasses(data.classes || []);
      } catch {
        setClasses([]);
        toast.error("Could not load your classes. Create a class from Students first.");
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!editId) return;
      try {
        const data = await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS_TEACHER}/${editId}`);
        const found = data.assignment;
        if (!found) return;
        setTitle(found.title || "");
        setDescription(found.description || "");
        setTopic(found.topic || "");
        setDifficulty(found.difficulty || "");
        setAssignmentLanguage(found.questions?.[0]?.language || "");
        if (found.deadline) {
          const d = new Date(found.deadline);
          setDeadline(Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10));
        } else {
          setDeadline("");
        }
        const cid = found.classId?._id || found.classId;
        setClassId(cid ? String(cid) : "");
        setQuestions(normalizeQuestionsFromApi(found.questions || []));
        setNumQuestionsInput((found.questions?.length || 0).toString());
      } catch (err) {
        setError(err.message || "Failed to load assignment");
      }
    };

    loadAssignment();
  }, [editId]);

  const applyGeneratedQuestions = (generatedQuestions) => {
    const normalized = normalizeQuestionsFromApi(generatedQuestions);
    if (normalized.length === 0) {
      setQuestions([createEmptyQuestion()]);
      setNumQuestionsInput("1");
      return;
    }
    setQuestions(normalized);
    setNumQuestionsInput(String(normalized.length));
  };

  const handleGenerateFromTopic = async () => {
    if (!classId) {
      toast.error("Select a class first.");
      setStep(1);
      return;
    }
    if (!assignmentLanguage) {
      toast.error("Select a language first.");
      setStep(1);
      return;
    }

    const requestedCount = Math.min(Math.max(parseInt(numQuestionsInput || "0", 10) || 0, 1), 20);
    setAiLoading(true);
    setAiError("");
    const submittedTopic = topic.trim();
    const selectedLanguage = assignmentLanguage || "javascript";

    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.AI_ASSIGNMENT_QUESTIONS, "POST", {
        mode: "topic",
        topic: submittedTopic,
        difficulty,
        language: selectedLanguage,
        numQuestions: requestedCount,
        classId,
        className: selectedClassName,
        title,
        description,
      });
      applyGeneratedQuestions(data.questions || []);
      if (!submittedTopic && String(data.suggestedTopic || "").trim()) {
        setTopic(String(data.suggestedTopic).trim());
      }
      setAiMode("generated");
      setStep(2);
      toast.success(data.source === "gemini" ? "Questions generated with AI." : "AI draft generated.");
    } catch (err) {
      const msg = err.message || "Failed to generate questions";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEnhanceQuestion = async (index) => {
    const current = questions[index];
    if (!current) return;
    setAiLoading(true);
    setAiError("");
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.AI_ASSIGNMENT_QUESTIONS, "POST", {
        mode: "enhance",
        question: current,
        topic,
        difficulty,
        language: current.language || assignmentLanguage || "javascript",
        classId,
        className: selectedClassName,
        title,
        description,
      });
      const enhanced = data.question || current;
      setQuestions((prev) => prev.map((item, idx) => (idx === index ? enhanced : item)));
      setAiMode("manual");
      toast.success(data.source === "gemini" ? "Question enhanced." : "Draft question improved.");
    } catch (err) {
      const msg = err.message || "Failed to enhance question";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const publishAssignment = async () => {
    setSaving(true);
    setError("");

    if (!classId) {
      setError("Select a class / subject before publishing.");
      toast.error("Select a class for this assignment.");
      setSaving(false);
      setStep(1);
      return;
    }

    const qErr = validateQuestionsForSave(questions);
    if (qErr) {
      setError(qErr);
      toast.error(qErr);
      setSaving(false);
      setStep(2);
      return;
    }

    const deadlineIso = deadline ? new Date(`${deadline}T23:59:59`).toISOString() : "";

    const payload = {
      title,
      description,
      topic,
      difficulty,
      deadline: deadlineIso,
      classId,
      questions,
      status: "published",
    };

    try {
      if (editId) {
        await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS_TEACHER}/${editId}`, "PUT", payload);
      } else {
        await apiCall(API_CONFIG.ENDPOINTS.ASSIGNMENTS_TEACHER, "POST", payload);
      }
      toast.success(editId ? "Assignment updated." : "Assignment published.");
      navigate("/teacher-dashboard");
    } catch (err) {
      setError(err.message || "Failed to save assignment");
      toast.error(err.message || "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">
          <div className="step-progress">
            <div className={`step-item ${step === 1 ? "active" : step > 1 ? "completed" : ""}`} data-step="1"><div className="step-number">1</div><span className="step-label">Assignment Details</span></div><div className={`step-line ${step > 1 ? "active" : ""}`} />
            <div className={`step-item ${step === 2 ? "active" : step > 2 ? "completed" : ""}`} data-step="2"><div className="step-number">2</div><span className="step-label">Questions</span></div><div className={`step-line ${step > 2 ? "active" : ""}`} />
            <div className={`step-item ${step === 3 ? "active" : ""}`}><div className="step-number">3</div><span className="step-label">Publish</span></div>
          </div>
          <div className="form-container">
            {step === 1 ? (
              <div className="form-step active" id="step1">
                <div className="form-step-header">
                  <h2 className="form-step-title"><i className="fas fa-info-circle" />Assignment Details</h2>
                  <p className="form-step-desc">Enter the basic information about your assignment.</p>
                </div>
                {error ? <p style={{ color: "#dc2626", marginBottom: "12px" }}>{error}</p> : null}
                <div className="form-card">
                  <div className="form-group">
                    <label htmlFor="assignmentTitle">Assignment Title <span className="required">*</span></label>
                    <input type="text" id="assignmentTitle" placeholder="Enter assignment title" required value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="assignmentDescription">Description</label>
                    <textarea id="assignmentDescription" rows="4" placeholder="Enter assignment description..." value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="form-row compact-row">
                    <div className="form-group">
                      <label htmlFor="classId">Class / Subject <span className="required">*</span></label>
                      <div className="select-wrapper">
                        <select id="classId" required value={classId} onChange={(e) => setClassId(e.target.value)} disabled={classesLoading}>
                          <option value="">{classesLoading ? "Loading classes…" : "Select a class"}</option>
                          {classes.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                        </select>
                        <i className="fas fa-chevron-down" />
                      </div>
                      {!classesLoading && classes.length === 0 ? <p style={{ fontSize: "13px", color: "#b45309", marginTop: "8px" }}>Create a class under Students to publish assignments.</p> : null}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="topic">Topic</label>
                      <input
                        type="text"
                        id="topic"
                        placeholder="Type a topic or leave blank for AI to suggest one"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                      <p className="ai-assist-note">Optional — the AI can suggest a topic if you leave this blank.</p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="difficulty">Difficulty <span className="required">*</span></label>
                      <div className="select-wrapper">
                        <select id="difficulty" required value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                          <option value="">Select Difficulty</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <i className="fas fa-chevron-down" />
                      </div>
                    </div>
                  </div>
                  <div className="form-row compact-row">
                    <div className="form-group">
                      <label htmlFor="assignmentLanguage">Language <span className="required">*</span></label>
                      <div className="select-wrapper">
                        <select
                          id="assignmentLanguage"
                          required
                          value={assignmentLanguage}
                          onChange={(e) => handleAssignmentLanguageChange(e.target.value)}
                        >
                          <option value="">Select Language</option>
                          <option value="java">Java</option>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                          <option value="javascript">JavaScript</option>
                        </select>
                        <i className="fas fa-chevron-down" />
                      </div>
                      <p className="ai-assist-note">This becomes the default language for AI-generated questions.</p>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="deadline">Deadline <span className="required">*</span></label>
                      <input type="date" id="deadline" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="numQuestions">Number of Questions <span className="required">*</span></label>
                      <input
                        type="number"
                        id="numQuestions"
                        min="1"
                        max="20"
                        value={numQuestionsInput}
                        placeholder="e.g. 5"
                        required
                        onChange={(e) => {
                          const val = e.target.value;
                          setNumQuestionsInput(val);
                          if (val === "") {
                            setQuestions([]);
                            return;
                          }
                          const count = parseInt(val);
                          if (isNaN(count)) return;
                          const newCount = Math.min(Math.max(count, 0), 20);
                          let updatedQuestions = [...questions];
                          if (newCount > questions.length) {
                            for (let i = questions.length; i < newCount; i++) {
                              updatedQuestions.push(createEmptyQuestion());
                            }
                          } else if (newCount < questions.length) {
                            updatedQuestions = updatedQuestions.slice(0, newCount);
                          }
                          setQuestions(updatedQuestions);
                        }}
                      />
                    </div>
                  </div>

                  <div className="ai-assist-section">
                    <div className="ai-assist-header">
                      <h3>How should Gemini help?</h3>
                      <p>Choose the faster path, or start manually and enhance individual questions later.</p>
                    </div>
                    {aiError ? <div className="ai-assist-error">{aiError}</div> : null}
                    <div className="ai-assist-grid">
                      <button
                        type="button"
                        className={`ai-choice-card ${aiMode === "manual" ? "active" : ""}`}
                        onClick={() => setAiMode("manual")}
                      >
                        <div className="ai-choice-icon"><i className="fas fa-pen-fancy" /></div>
                        <div className="ai-choice-content">
                          <strong>Write manually</strong>
                          <span>I’ll draft the questions myself, then use AI to polish a question if needed.</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`ai-choice-card ${aiMode === "generated" ? "active" : ""}`}
                        onClick={handleGenerateFromTopic}
                        disabled={aiLoading}
                      >
                        <div className="ai-choice-icon"><i className={`fas ${aiLoading ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} /></div>
                        <div className="ai-choice-content">
                          <strong>Generate from topic</strong>
                          <span>Gemini will draft all questions from the selected topic, difficulty, and count.</span>
                        </div>
                      </button>
                    </div>
                    <div className="ai-assist-note">
                      Tip: click a question’s AI button later to rewrite the title, description, examples, test cases, and starter code.
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => navigate("/teacher-dashboard")}><i className="fas fa-times" />Cancel</button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (!assignmentLanguage) {
                        toast.error("Select a language before continuing.");
                        return;
                      }
                      setStep(2);
                    }}
                  >
                    Next<i className="fas fa-arrow-right" />
                  </button>
                </div>
              </div>
            ) : null}
            {step === 2 ? (
              <div className="form-step active" id="step2">
                <div className="form-step-header">
                  <h2 className="form-step-title"><i className="fas fa-question-circle" /> Questions</h2>
                  <p className="form-step-desc">Add coding problems with detailed specifications and test cases.</p>
                </div>
                
                <div className="questions-container" id="questionsContainer">
                  {questions.map((q, i) => (
                    <div className="question-card modern" key={i}>
                      <div className="question-card-header">
                        <h3 className="question-number">Question <span className="q-num">{i + 1}</span></h3>
                        <div className="question-card-actions">
                          <button
                            type="button"
                            className="btn-ai-enhance"
                            onClick={() => handleEnhanceQuestion(i)}
                            disabled={aiLoading}
                          >
                            <i className={`fas ${aiLoading ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} />
                            <span>AI Enhance</span>
                          </button>
                          <button 
                            type="button" 
                            className="btn-delete-question" 
                            onClick={() => {
                              if (questions.length > 1) {
                                const n = questions.filter((_, idx) => idx !== i);
                                setQuestions(n);
                                setNumQuestionsInput(n.length.toString());
                              }
                            }}
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </div>

                      <div className="question-card-body">
                        {/* Section 1: Problem Details */}
                        <div className="form-section">
                          <h4 className="section-title">🔹 Section 1: Problem Details</h4>
                          <div className="form-group">
                            <label>Problem Title <span className="required">*</span></label>
                            <input 
                              type="text" 
                              placeholder="e.g. Two Sum" 
                              required 
                              value={q.problemTitle} 
                              onChange={(e) => {
                                const v = e.target.value;
                                setQuestions((prev) => prev.map((item, j) => (j === i ? { ...item, problemTitle: v } : item)));
                              }} 
                            />
                          </div>
                          <div className="form-group">
                            <label>Problem Description <span className="required">*</span></label>
                            <textarea 
                              rows="4" 
                              placeholder="Describe the problem logic and requirements..." 
                              required 
                              value={q.problemDescription} 
                              onChange={(e) => {
                                const v = e.target.value;
                                setQuestions((prev) => prev.map((item, j) => (j === i ? { ...item, problemDescription: v } : item)));
                              }} 
                            />
                          </div>
                        </div>

                        {/* Section 2: Constraints & Examples */}
                        <div className="form-section">
                          <h4 className="section-title">🔹 Section 2: Constraints & Examples</h4>
                          <div className="form-group">
                            <label>Constraints</label>
                            <textarea 
                              rows="3" 
                              placeholder="e.g. 1 <= n <= 10^5" 
                              value={q.constraints} 
                              onChange={(e) => {
                                const v = e.target.value;
                                setQuestions((prev) => prev.map((item, j) => (j === i ? { ...item, constraints: v } : item)));
                              }} 
                            />
                          </div>
                          <div className="form-group">
                            <label>Example Input / Output</label>
                            <textarea 
                              rows="3" 
                              placeholder="Input: [2,7,11,15], target = 9 \nOutput: [0,1]" 
                              value={q.examples} 
                              onChange={(e) => {
                                const v = e.target.value;
                                setQuestions((prev) => prev.map((item, j) => (j === i ? { ...item, examples: v } : item)));
                              }} 
                            />
                          </div>
                        </div>

                        {/* Section 3: Coding Setup */}
                        <div className="form-section">
                          <h4 className="section-title">🔹 Section 3: Coding Setup</h4>
                          <div className="form-group mt-4">
                            <label>Starter Code (Editor Box)</label>
                            <div className="code-editor-wrapper">
                              <textarea 
                                className="starter-code-editor"
                                rows="8" 
                                placeholder="// Write starter code for students here..." 
                                value={q.starterCode} 
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setQuestions((prev) => prev.map((item, j) => (j === i ? { ...item, starterCode: v } : item)));
                                }} 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Test Cases */}
                        <div className="form-section">
                          <h4 className="section-title">🔹 Section 4: Test Cases</h4>
                          <div className="test-cases-list">
                            {q.testCases.map((tc, tcIdx) => (
                              <div className="test-case-item" key={tcIdx}>
                                <div className="test-case-header">
                                  <span>[Test Case {tcIdx + 1}]</span>
                                  {q.testCases.length > 1 && (
                                    <button 
                                      type="button" 
                                      className="btn-remove-tc"
                                      onClick={() => {
                                        setQuestions((prev) =>
                                          prev.map((item, j) =>
                                            j !== i
                                              ? item
                                              : {
                                                  ...item,
                                                  testCases: item.testCases.filter((_, idx) => idx !== tcIdx),
                                                }
                                          )
                                        );
                                      }}
                                    >
                                      <i className="fas fa-times" />
                                    </button>
                                  )}
                                </div>
                                <div className="test-case-row">
                                  <div className="form-group">
                                    <label>Input:</label>
                                    <textarea 
                                      rows="2" 
                                      placeholder="Test input..." 
                                      value={tc.input} 
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setQuestions((prev) =>
                                          prev.map((item, j) =>
                                            j !== i
                                              ? item
                                              : {
                                                  ...item,
                                                  testCases: item.testCases.map((row, k) =>
                                                    k === tcIdx ? { ...row, input: v } : row
                                                  ),
                                                }
                                          )
                                        );
                                      }}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Output:</label>
                                    <textarea 
                                      rows="2" 
                                      placeholder="Expected output..." 
                                      value={tc.output} 
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setQuestions((prev) =>
                                          prev.map((item, j) =>
                                            j !== i
                                              ? item
                                              : {
                                                  ...item,
                                                  testCases: item.testCases.map((row, k) =>
                                                    k === tcIdx ? { ...row, output: v } : row
                                                  ),
                                                }
                                          )
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            type="button" 
                            className="btn-add-tc"
                            onClick={() => {
                              setQuestions((prev) =>
                                prev.map((item, j) =>
                                  j !== i ? item : { ...item, testCases: [...item.testCases, { input: "", output: "" }] }
                                )
                              );
                            }}
                          >
                            <i className="fas fa-plus" /> Add Test Case
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="add-question-btn-wrapper">
                  <button 
                    type="button" 
                    className="btn-add-question" 
                    onClick={() => {
                      const n = [...questions, createEmptyQuestion()];
                      setQuestions(n);
                      setNumQuestionsInput(n.length.toString());
                    }}
                  >
                    <i className="fas fa-plus" /> Add Another Question
                  </button>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}><i className="fas fa-arrow-left" /> Previous</button>
                  <button type="button" className="btn-primary" onClick={() => setStep(3)}>Next <i className="fas fa-arrow-right" /></button>
                </div>
              </div>
            ) : null}
            {step === 3 ? <div className="form-step active" id="step3"><div className="form-step-header"><h2 className="form-step-title"><i className="fas fa-paper-plane" />{editId ? "Update Assignment" : "Publish Assignment"}</h2><p className="form-step-desc">Review your assignment before {editId ? "updating" : "publishing"}.</p></div><div className="summary-card"><h3 className="summary-title">Assignment Summary</h3><div className="summary-grid"><div className="summary-item"><div className="summary-icon purple"><i className="fas fa-heading" /></div><div className="summary-content"><span className="summary-label">Title</span><span className="summary-value" id="summaryTitle">{title || "-"}</span></div></div><div className="summary-item"><div className="summary-icon green"><i className="fas fa-tag" /></div><div className="summary-content"><span className="summary-label">Topic</span><span className="summary-value" id="summaryTopic">{topic || "-"}</span></div></div><div className="summary-item"><div className="summary-icon teal"><i className="fas fa-chalkboard-teacher" /></div><div className="summary-content"><span className="summary-label">Class</span><span className="summary-value">{selectedClassName || "—"}</span></div></div><div className="summary-item"><div className="summary-icon orange"><i className="fas fa-signal" /></div><div className="summary-content"><span className="summary-label">Difficulty</span><span className="summary-value" id="summaryDifficulty">{difficulty || "-"}</span></div></div><div className="summary-item"><div className="summary-icon blue"><i className="fas fa-question" /></div><div className="summary-content"><span className="summary-label">Questions</span><span className="summary-value" id="summaryQuestions">{questions.length}</span></div></div><div className="summary-item"><div className="summary-icon pink"><i className="fas fa-calendar-alt" /></div><div className="summary-content"><span className="summary-label">Deadline</span><span className="summary-value" id="summaryDeadline">{deadline || "-"}</span></div></div></div><div className="summary-questions"><h4>Questions Preview</h4><div className="questions-preview" id="questionsPreview">{questions.map((q, i) => <div className="preview-question" key={i}><div className="preview-question-num">{i + 1}</div><span className="preview-question-title">{q.problemTitle || "Untitled Question"}</span><span className="preview-question-lang">{q.language || "N/A"}</span></div>)}</div></div></div><div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setStep(2)}><i className="fas fa-arrow-left" />Previous</button><button type="button" className="btn-primary btn-publish" onClick={publishAssignment} disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-paper-plane" /> {editId ? "Update Assignment" : "Save Assignment"}</>}</button></div></div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CreateAssignmentPage;
