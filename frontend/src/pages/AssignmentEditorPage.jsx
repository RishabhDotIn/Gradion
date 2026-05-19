import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { marked } from "marked";
import DOMPurify from "dompurify";

import { apiCall, API_CONFIG } from "../lib/apiConfig.js";

import "../styles/assignmentEditor.css";

/** Ensure each question has the fields the editor UI expects (handles legacy / sparse docs). */
function normalizeEditorQuestions(questions) {
  const raw = Array.isArray(questions) ? questions : [];
  return raw.map((q, idx) => {
    const row = q && typeof q === "object" ? { ...q } : {};
    const testCases = Array.isArray(row.testCases)
      ? row.testCases.map((tc) => ({
          input: tc?.input != null ? String(tc.input) : "",
          output: tc?.output != null ? String(tc.output) : "",
        }))
      : [];
    const title = String(row.problemTitle || row.title || "").trim();
    const desc = String(row.problemDescription || row.description || "").trim();
    const examplesField = String(row.examples || "").trim();
    return {
      ...row,
      problemTitle: title || `Question ${idx + 1}`,
      problemDescription:
        desc ||
        examplesField ||
        "No problem statement was provided. Ask your instructor to add a description, or use the assignment brief from your class page.",
      constraints: row.constraints != null ? String(row.constraints) : "",
      starterCode: row.starterCode != null ? String(row.starterCode) : "",
      language: row.language ? String(row.language) : "plaintext",
      testCases,
    };
  });
}

const AssignmentEditorPage = () => {
  const { id, qIdx } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(() => {
    const n = parseInt(qIdx, 10);
    return Number.isFinite(n) ? n : 0;
  });
  const [activeTestTab, setActiveTestTab] = useState("testcases");
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [codes, setCodes] = useState({});
  /** Code snapshot from the last successful Run for this question (submit must use this). */
  const [verifiedByQuestion, setVerifiedByQuestion] = useState({});
  const [canSubmit, setCanSubmit] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [submittingAi, setSubmittingAi] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFs, setIsFs] = useState(false);

  const [leftWidth, setLeftWidth] = useState(38);
  const [editorHeight, setEditorHeight] = useState(62);

  const codeWrapRef = useRef(null);

  const userKey = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return "guest";
    try {
      const parsed = JSON.parse(userStr);
      return parsed?._id || parsed?.id || "guest";
    } catch {
      return "guest";
    }
  }, []);

  const progressKey = useMemo(() => `gradion_progress_${userKey}_${id}`, [id, userKey]);
  const [codeBoxHeight, setCodeBoxHeight] = useState(360);
  const isResizingH = useRef(false);
  const isResizingV = useRef(false);
  const editorWorkbenchRef = useRef(null);

  useEffect(() => {
    const el = codeWrapRef.current;
    if (!el || pageLoading) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setCodeBoxHeight(Math.max(200, Math.floor(h)));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageLoading, currentQuestionIdx, id, editorHeight, leftWidth]);

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const n = parseInt(qIdx, 10);
    if (Number.isFinite(n) && n >= 0) setCurrentQuestionIdx(n);
  }, [qIdx]);

  useEffect(() => {
    if (!assignment?.questions?.length) return;
    const max = assignment.questions.length - 1;
    if (currentQuestionIdx > max) {
      setCurrentQuestionIdx(max);
      setActiveCaseIdx(0);
      navigate(`/assignment/${id}/editor/${max}`, { replace: true });
    }
  }, [assignment, currentQuestionIdx, id, navigate]);

  useEffect(() => {
    const loadAssignment = async () => {
      setPageLoading(true);
      try {
        const response = await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS_STUDENT}/${id}`);
        if (response.success) {
          const assignmentData = { ...response.assignment };
          let qs = assignmentData.questions;
          if (typeof qs === "string") {
            try {
              qs = JSON.parse(qs);
            } catch {
              qs = [];
            }
          }
          const normalized = normalizeEditorQuestions(qs);
          if (!normalized.length) {
            toast.error("This assignment has no questions yet.");
            navigate("/student-assignments");
            return;
          }
          assignmentData.questions = normalized;
          setAssignment(assignmentData);
          setCanSubmit(response.canSubmit !== false);

          const initialCodes = {};
          normalized.forEach((q, idx) => {
            initialCodes[idx] = q.starterCode || "";
          });
          setCodes(initialCodes);
          setVerifiedByQuestion({});
          setRunResult(null);
          setAiResult(null);
        } else {
          navigate("/student-assignments");
        }
      } catch (error) {
        console.error("Failed to load assignment:", error);
        toast.error(error.message || "Failed to load assignment");
        navigate("/student-assignments");
      } finally {
        setPageLoading(false);
      }
    };

    loadAssignment();
  }, [id, navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingH.current) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 22 && newWidth < 72) setLeftWidth(newWidth);
      }
      if (isResizingV.current) {
        const host = editorWorkbenchRef.current;
        if (host) {
          const rect = host.getBoundingClientRect();
          const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
          if (newHeight > 24 && newHeight < 82) setEditorHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      isResizingH.current = false;
      isResizingV.current = false;
      document.body.style.cursor = "default";
      document.body.classList.remove("no-select");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizingH = () => {
    isResizingH.current = true;
    document.body.style.cursor = "col-resize";
    document.body.classList.add("no-select");
  };

  const startResizingV = () => {
    isResizingV.current = true;
    document.body.style.cursor = "row-resize";
    document.body.classList.add("no-select");
  };

  const goQuestion = useCallback(
    (idx) => {
      if (!assignment?.questions?.length) return;
      const max = assignment.questions.length - 1;
      const next = Math.max(0, Math.min(max, idx));
      setCurrentQuestionIdx(next);
      setActiveCaseIdx(0);
      setRunResult(null);
      setAiResult(null);
      setActiveTestTab("testcases");
      navigate(`/assignment/${id}/editor/${next}`, { replace: true });
    },
    [assignment?.questions?.length, id, navigate]
  );

  const handleEditorChange = (value) => {
    const v = value ?? "";
    setCodes((prev) => ({ ...prev, [currentQuestionIdx]: v }));
    setVerifiedByQuestion((prev) => {
      if (prev[currentQuestionIdx] === undefined) return prev;
      if (prev[currentQuestionIdx] === v) return prev;
      const next = { ...prev };
      delete next[currentQuestionIdx];
      return next;
    });
  };

  const handleRun = async () => {
    const code = codes[currentQuestionIdx] ?? "";
    const q = assignment?.questions?.[currentQuestionIdx];
    if (!q) return;

    setRunLoading(true);
    setRunResult(null);
    const t = toast.loading("Running with AI analysis…");
    try {
      const res = await apiCall(API_CONFIG.ENDPOINTS.SUBMISSIONS_RUN, "POST", {
        assignmentId: id,
        code,
        language: q.language || "plaintext",
        questionIndex: currentQuestionIdx,
      });
      toast.dismiss(t);
      if (!res.success) {
        toast.error(res.message || "Run failed");
        return;
      }
      const run = res.run || {};
      setRunResult(run);
      setVerifiedByQuestion((prev) => ({ ...prev, [currentQuestionIdx]: code }));
      setActiveTestTab("results");
      // Show toast matching the run verdict (error/failed => error toast; partial => warning; passed => success)
      const verdict = (run.verdict || "").toLowerCase();
      if (verdict === 'error' || verdict === 'failed') {
        toast.error(run.summary || 'Run finished with errors');
      } else if (verdict === 'partial') {
        toast(run.summary || 'Run finished (partial)', { icon: '⚠️' });
      } else {
        toast.success(run.summary || 'Run finished');
      }
    } catch (error) {
      toast.dismiss(t);
      toast.error(error.message || "Run failed");
    } finally {
      setRunLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!canSubmit) {
      toast.error("The deadline has passed for this assignment.");
      return;
    }
    const snap = verifiedByQuestion[currentQuestionIdx];
    if (snap === undefined) {
      toast.error("Run your code first, then submit your last run.");
      return;
    }

    const q = assignment?.questions?.[currentQuestionIdx];
    setSubmittingAi(true);
    setAiResult(null);
    const t = toast.loading("AI is evaluating your code and running plagiarism checks…");
    try {
      const res = await apiCall(API_CONFIG.ENDPOINTS.SUBMISSIONS, "POST", {
        assignmentId: id,
        code: snap,
        language: q?.language || "plaintext",
        questionIndex: currentQuestionIdx,
      });
      setAiResult(res.evaluation || null);
      const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
      progress[currentQuestionIdx] = true;
      localStorage.setItem(progressKey, JSON.stringify(progress));
      toast.dismiss(t);
      toast.success("Submission graded.");
      if (currentQuestionIdx === assignment.questions.length - 1) {
        navigate(`/assignment/${id}`);
      } else {
        goQuestion(currentQuestionIdx + 1);
      }
    } catch (error) {
      toast.dismiss(t);
      toast.error(error.message || "Submission failed");
    } finally {
      setSubmittingAi(false);
    }
  };

  const toggleEditorFullscreen = async () => {
    const el = editorWorkbenchRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Fullscreen is not available in this browser.");
    }
  };

  const mapMonacoLang = (lang) => {
    const l = (lang || "javascript").toLowerCase();
    if (l === "c++" || l === "cpp") return "cpp";
    return l;
  };

  const currentQuestion = useMemo(() => {
    return assignment?.questions?.[currentQuestionIdx] || null;
  }, [assignment, currentQuestionIdx]);

  const sampleTestCases = useMemo(() => {
    const t = currentQuestion?.testCases;
    return Array.isArray(t) && t.length > 0 ? t : [];
  }, [currentQuestion?.testCases]);

  const emptyAiHtml = "<p>No feedback text.</p>";
  const aiFeedbackHtml = useMemo(() => {
    const raw = aiResult?.feedback || "";
    if (!raw) return "";
    return DOMPurify.sanitize(marked.parse(raw, { async: false }));
  }, [aiResult]);

  const constraintLines = useMemo(() => {
    const c = currentQuestion?.constraints;
    if (!c) return [];
    if (Array.isArray(c)) return c.map(String);
    return String(c)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [currentQuestion?.constraints]);

  if (pageLoading || !assignment) {
    return (
      <div className={`editor-page-root editor-page-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
        <div className="editor-loading">
          <i className="fas fa-spinner fa-spin" aria-hidden />
          <p>Loading assignment…</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={`editor-page-root editor-page-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
        <div className="editor-loading">
          <i className="fas fa-exclamation-circle" style={{ color: "#f59e0b" }} aria-hidden />
          <p>This assignment has no question at this index.</p>
          <button type="button" className="btn-run-editor" style={{ marginTop: 16 }} onClick={() => navigate("/student-assignments")}>
            Back to assignments
          </button>
        </div>
      </div>
    );
  }

  const hasVerified = verifiedByQuestion[currentQuestionIdx] !== undefined;

  return (
    <div className={`editor-page-root editor-page-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      <nav className="editor-navbar">
        <div className="nav-left">
          <div className="nav-logo">
            <div className="logo-icon">
              <i className="fas fa-graduation-cap" />
            </div>
            <span className="logo-text">Gradion</span>
          </div>
          <button
            type="button"
            className="nav-dashboard-btn"
            onClick={() => navigate("/student-assignments")}
            title="Back to Assignments"
          >
            <i className="fas fa-th-large" />
          </button>
          <div className="nav-divider" />
          <div className="nav-assignment-info">
            <span className="nav-assignment-title">{assignment.title}</span>
          </div>
        </div>

        <div className="nav-question-nav">
          <button
            type="button"
            className="q-nav-btn"
            disabled={currentQuestionIdx === 0}
            onClick={() => goQuestion(currentQuestionIdx - 1)}
          >
            <i className="fas fa-chevron-left" />
          </button>
          <div className="q-nav-indicator">
            Question {currentQuestionIdx + 1} / {assignment.questions.length}
          </div>
          <button
            type="button"
            className="q-nav-btn"
            disabled={currentQuestionIdx === assignment.questions.length - 1}
            onClick={() => goQuestion(currentQuestionIdx + 1)}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        <div className="nav-right">
          <button type="button" className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"}`} />
          </button>
          <div className="nav-user">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}`
              }
              alt=""
              className="nav-avatar"
            />
            <span className="nav-username">{user?.fullName || "Student"}</span>
          </div>
        </div>
      </nav>

      <div className="editor-main-content">
        <aside className="problem-panel" style={{ flex: `0 0 ${leftWidth}%`, maxWidth: "72%", minWidth: "22%" }}>
          <div className="problem-header">
            <div className="problem-meta">
              <span
                className={`meta-badge ${(currentQuestion.difficulty || assignment.difficulty || "medium").toLowerCase()}`}
              >
                {currentQuestion.difficulty || assignment.difficulty || "Medium"}
              </span>
            </div>
            <h1 className="problem-title">{currentQuestion.problemTitle}</h1>
          </div>

          <div className="problem-description">{currentQuestion.problemDescription}</div>

          {constraintLines.length > 0 ? (
            <>
              <span className="section-label">Constraints</span>
              <div className="constraints-box">
                <ul className="constraints-list">
                  {constraintLines.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          <span className="section-label">Examples</span>
          {sampleTestCases.length > 0 ? (
            <div className="examples-list">
              {sampleTestCases.map((tc, i) => (
                <div className="example-item" key={i}>
                  <span className="example-title">Example {i + 1}</span>
                  <div className="example-box">
                    <div className="example-line">
                      <span className="label">Input:</span>
                      <span className="val">{tc.input}</span>
                    </div>
                    <div className="example-line">
                      <span className="label">Output:</span>
                      <span className="val">{tc.output}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="problem-empty-hint">No sample input/output was published for this question.</p>
          )}
        </aside>

        <div className="resizer-h" onMouseDown={startResizingH} role="separator" aria-orientation="vertical" />

        <div className="editor-workbench" ref={editorWorkbenchRef}>
          <div className="editor-section-top" style={{ flex: `0 0 ${editorHeight}%`, minHeight: 0 }}>
            <div className="editor-header">
              <div className="editor-controls-left">
                <span className="lang-pill">{currentQuestion.language || "Code"}</span>
                {hasVerified ? (
                  <span className="run-verified-badge">
                    <i className="fas fa-check-circle" /> Last run ready to submit
                  </span>
                ) : (
                  <span className="run-hint-badge">Run to enable Submit</span>
                )}
              </div>
              <div className="editor-controls-right">
                <button
                  type="button"
                  className="btn-fs-editor"
                  onClick={toggleEditorFullscreen}
                  title={isFs ? "Exit fullscreen" : "Fullscreen editor"}
                >
                  <i className={`fas ${isFs ? "fa-compress" : "fa-expand"}`} />
                </button>
              </div>
            </div>

            <div ref={codeWrapRef} className="code-area-wrapper">
              <Editor
                key={`${currentQuestionIdx}-${id}`}
                height={codeBoxHeight}
                language={mapMonacoLang(currentQuestion.language)}
                value={codes[currentQuestionIdx] || ""}
                theme={isDarkMode ? "vs-dark" : "light"}
                onChange={handleEditorChange}
                options={{
                  fontSize: 14,
                  lineNumbers: "on",
                  minimap: { enabled: true, scale: 0.85 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  roundedSelection: true,
                  padding: { top: 12 },
                  formatOnPaste: true,
                  formatOnType: true,
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  tabSize: 4,
                  wordWrap: "on",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          </div>

          <div className="resizer-v" onMouseDown={startResizingV} role="separator" aria-orientation="horizontal" />

          <div className="test-panel" style={{ flex: "1 1 auto", minHeight: 0 }}>
            <div className="test-header">
              <div
                role="button"
                tabIndex={0}
                className={`test-tab ${activeTestTab === "testcases" ? "active" : ""}`}
                onClick={() => setActiveTestTab("testcases")}
                onKeyDown={(e) => e.key === "Enter" && setActiveTestTab("testcases")}
              >
                Test Cases
              </div>
              <div
                role="button"
                tabIndex={0}
                className={`test-tab ${activeTestTab === "results" ? "active" : ""}`}
                onClick={() => setActiveTestTab("results")}
                onKeyDown={(e) => e.key === "Enter" && setActiveTestTab("results")}
              >
                AI Run Output
              </div>

              <div className="footer-actions">
                <button type="button" className="btn-run-editor" onClick={handleRun} disabled={runLoading}>
                  <i className="fas fa-play" /> {runLoading ? "Running…" : "Run"}
                </button>
                <button
                  type="button"
                  className="btn-submit-editor"
                  onClick={handleQuestionSubmit}
                  disabled={submittingAi || !canSubmit || !hasVerified}
                >
                  <i className="fas fa-rocket" /> {submittingAi ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>
            <div className="test-body">
              {activeTestTab === "testcases" ? (
                sampleTestCases.length > 0 ? (
                  <>
                    <div className="test-case-nav">
                      {sampleTestCases.map((_, idx) => (
                        <button
                          type="button"
                          key={idx}
                          className={`case-btn ${activeCaseIdx === idx ? "active" : ""}`}
                          onClick={() => setActiveCaseIdx(idx)}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>
                    <div className="case-content">
                      <span className="case-input-label">Input</span>
                      <div className="case-input-box">{sampleTestCases[activeCaseIdx]?.input ?? "—"}</div>

                      <span className="case-input-label" style={{ marginTop: "16px" }}>
                        Expected Output
                      </span>
                      <div className="case-input-box">{sampleTestCases[activeCaseIdx]?.output ?? "—"}</div>
                    </div>
                  </>
                ) : (
                  <div className="results-placeholder">
                    <i className="fas fa-flask" />
                    <p>No test cases are published for this question yet. You can still write code and use Run for AI feedback.</p>
                  </div>
                )
              ) : (
                <div className="run-results-pane">
                  {runResult ? (
                    <>
                      <div className="run-summary-row">
                        <span className={`run-verdict run-verdict--${(runResult.verdict || "").toLowerCase()}`}>
                          {runResult.verdict || "—"}
                        </span>
                        {runResult.summary ? <span className="run-summary-text">{runResult.summary}</span> : null}
                      </div>
                      <span className="case-input-label">Output</span>
                      <pre className="run-output-block">{runResult.output || "(no output)"}</pre>
                      {Array.isArray(runResult.perTest) && runResult.perTest.length > 0 ? (
                        <>
                          <span className="case-input-label" style={{ marginTop: "12px" }}>
                            Per test
                          </span>
                          <ul className="run-per-test-list">
                            {runResult.perTest.map((row, i) => (
                              <li key={i} className={row.pass ? "pass" : "fail"}>
                                <strong>Case {row.caseIndex ?? i}:</strong>{" "}
                                {row.pass ? "pass" : "fail"} — {row.actualOrNote || "—"}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <div className="results-placeholder">
                      <i className="fas fa-terminal" />
                      <p>Run your code to see AI-simulated output and test feedback.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {aiResult ? (
        <section
          className={`ai-evaluation-panel ${isDarkMode ? "ai-evaluation-panel--dark" : "ai-evaluation-panel--light"}`}
        >
          <h3>
            <i className="fas fa-robot" /> AI evaluation
          </h3>
          <div className="ai-meta-row">
            <span>
              AI status: <strong>{aiResult.aiStatus || "—"}</strong>
            </span>
            <span>
              Score: <strong>{aiResult.score ?? "—"}</strong>/100
            </span>
            <span>
              Plagiarism:{" "}
              <strong className={(aiResult.plagiarismScore || 0) > 80 ? "text-danger" : ""}>
                {`${aiResult.plagiarismScore ?? 0}%`}
              </strong>
            </span>
            {aiResult.late ? (
              <span className="meta-badge meta-badge--late">Late submission</span>
            ) : null}
          </div>
          {aiResult.plagiarismExplanation ? <p className="ai-plagiarism-note">{aiResult.plagiarismExplanation}</p> : null}
          <div className="ai-feedback-md" dangerouslySetInnerHTML={{ __html: aiFeedbackHtml || emptyAiHtml }} />
        </section>
      ) : null}
    </div>
  );
};

export default AssignmentEditorPage;
