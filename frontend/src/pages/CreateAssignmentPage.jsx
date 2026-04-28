import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import "../styles/teacherDashboard.css";
import "../styles/createAssignment.css";

function CreateAssignmentPage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState([]);
  // Helper to create a new empty question
  const createEmptyQuestion = () => ({
    problemTitle: "",
    problemDescription: "",
    constraints: "",
    examples: "",
    language: "",
    starterCode: "",
    testCases: [{ input: "", output: "" }]
  });
  const [numQuestionsInput, setNumQuestionsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get("edit");

  useEffect(() => {
    if (editId) {
      const assignments = JSON.parse(localStorage.getItem("gradion_assignments") || "[]");
      const found = assignments.find((a) => a.id.toString() === editId);
      if (found) {
        setTitle(found.title || "");
        setDescription(found.description || "");
        setTopic(found.topic || "");
        setDifficulty(found.difficulty || "");
        setDeadline(found.deadline || "");
        setQuestions(found.questions || []);
        setNumQuestionsInput((found.questions?.length || 0).toString());
      }
    }
  }, [editId]);

  const publishAssignment = () => {
    setSaving(true);
    let assignments = JSON.parse(localStorage.getItem("gradion_assignments") || "[]");
    
    if (editId) {
      assignments = assignments.map((a) => 
        a.id.toString() === editId 
          ? { ...a, title, description, topic, difficulty, deadline, questions, updatedAt: new Date().toISOString() } 
          : a
      );
    } else {
      assignments.push({ id: Date.now(), title, description, topic, difficulty, deadline, questions, createdAt: new Date().toISOString(), status: "published" });
    }
    
    localStorage.setItem("gradion_assignments", JSON.stringify(assignments));
    setTimeout(() => navigate("/teacher-dashboard"), 1200);
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left"><h1 className="header-title">{editId ? "Edit Assignment" : "Create Assignment"}</h1></div>
          <div className="header-right">
            <div className="header-search"><i className="fas fa-search" /><input type="text" placeholder="Search anything" /></div>
            <button className="header-icon-btn" type="button"><i className="fas fa-envelope" /></button>
            <button className="header-icon-btn" type="button"><i className="fas fa-bell" /></button>
            <div className="header-user">
              <div className="header-avatar"><img id="userAvatar" src="https://ui-avatars.com/api/?name=User&background=3B82F6&color=fff" alt="Profile" /></div>
              <div className="header-user-info"><span className="header-user-name" id="userName">Loading...</span><span className="header-user-role" id="userRole">Teacher</span></div>
              <i className="fas fa-chevron-down" />
            </div>
          </div>
        </header>
        <main className="dashboard-content">
          <div className="step-progress">
            <div className={`step-item ${step === 1 ? "active" : step > 1 ? "completed" : ""}`} data-step="1"><div className="step-number">1</div><span className="step-label">Assignment Details</span></div><div className={`step-line ${step > 1 ? "active" : ""}`} />
            <div className={`step-item ${step === 2 ? "active" : step > 2 ? "completed" : ""}`} data-step="2"><div className="step-number">2</div><span className="step-label">Questions</span></div><div className={`step-line ${step > 2 ? "active" : ""}`} />
            <div className={`step-item ${step === 3 ? "active" : ""}`}><div className="step-number">3</div><span className="step-label">Publish</span></div>
          </div>
          <div className="form-container">
            {step === 1 ? <div className="form-step active" id="step1"><div className="form-step-header"><h2 className="form-step-title"><i className="fas fa-info-circle" />Assignment Details</h2><p className="form-step-desc">Enter the basic information about your assignment.</p></div><div className="form-card"><div className="form-group"><label htmlFor="assignmentTitle">Assignment Title <span className="required">*</span></label><input type="text" id="assignmentTitle" placeholder="Enter assignment title" required value={title} onChange={(e) => setTitle(e.target.value)} /></div><div className="form-group"><label htmlFor="assignmentDescription">Description</label><textarea id="assignmentDescription" rows="4" placeholder="Enter assignment description..." value={description} onChange={(e) => setDescription(e.target.value)} /></div><div className="form-row"><div className="form-group"><label htmlFor="topic">Topic <span className="required">*</span></label><div className="select-wrapper"><select id="topic" required value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">Select Topic</option><option value="programming-fundamentals">Programming Fundamentals</option><option value="data-structures">Data Structures</option><option value="algorithms">Algorithms</option><option value="web-development">Web Development</option><option value="database">Database</option><option value="oop">Object-Oriented Programming</option></select><i className="fas fa-chevron-down" /></div></div><div className="form-group"><label htmlFor="difficulty">Difficulty <span className="required">*</span></label><div className="select-wrapper"><select id="difficulty" required value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="">Select Difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><i className="fas fa-chevron-down" /></div></div></div><div className="form-row"><div className="form-group"><label htmlFor="deadline">Deadline <span className="required">*</span></label><input type="date" id="deadline" required value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div><div className="form-group"><label htmlFor="numQuestions">Number of Questions <span className="required">*</span></label><input 
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
</div></div></div><div className="form-actions"><button type="button" className="btn-secondary" onClick={() => navigate("/teacher-dashboard")}><i className="fas fa-times" />Cancel</button><button type="button" className="btn-primary" onClick={() => setStep(2)}>Next<i className="fas fa-arrow-right" /></button></div></div> : null}
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
                                const n = [...questions];
                                n[i].problemTitle = e.target.value;
                                setQuestions(n);
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
                                const n = [...questions];
                                n[i].problemDescription = e.target.value;
                                setQuestions(n);
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
                                const n = [...questions];
                                n[i].constraints = e.target.value;
                                setQuestions(n);
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
                                const n = [...questions];
                                n[i].examples = e.target.value;
                                setQuestions(n);
                              }} 
                            />
                          </div>
                        </div>

                        {/* Section 3: Coding Setup */}
                        <div className="form-section">
                          <h4 className="section-title">🔹 Section 3: Coding Setup</h4>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Language <span className="required">*</span></label>
                              <div className="select-wrapper">
                                <select 
                                  required 
                                  value={q.language} 
                                  onChange={(e) => {
                                    const n = [...questions];
                                    n[i].language = e.target.value;
                                    setQuestions(n);
                                  }}
                                >
                                  <option value="">Select Language</option>
                                  <option value="java">Java</option>
                                  <option value="python">Python</option>
                                  <option value="cpp">C++</option>
                                  <option value="javascript">JavaScript</option>
                                </select>
                                <i className="fas fa-chevron-down" />
                              </div>
                            </div>
                          </div>
                          <div className="form-group mt-4">
                            <label>Starter Code (Editor Box)</label>
                            <div className="code-editor-wrapper">
                              <textarea 
                                className="starter-code-editor"
                                rows="8" 
                                placeholder="// Write starter code for students here..." 
                                value={q.starterCode} 
                                onChange={(e) => {
                                  const n = [...questions];
                                  n[i].starterCode = e.target.value;
                                  setQuestions(n);
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
                                        const n = [...questions];
                                        n[i].testCases = n[i].testCases.filter((_, idx) => idx !== tcIdx);
                                        setQuestions(n);
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
                                        const n = [...questions];
                                        n[i].testCases[tcIdx].input = e.target.value;
                                        setQuestions(n);
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
                                        const n = [...questions];
                                        n[i].testCases[tcIdx].output = e.target.value;
                                        setQuestions(n);
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
                              const n = [...questions];
                              n[i].testCases.push({ input: "", output: "" });
                              setQuestions(n);
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
            {step === 3 ? <div className="form-step active" id="step3"><div className="form-step-header"><h2 className="form-step-title"><i className="fas fa-paper-plane" />{editId ? "Update Assignment" : "Publish Assignment"}</h2><p className="form-step-desc">Review your assignment before {editId ? "updating" : "publishing"}.</p></div><div className="summary-card"><h3 className="summary-title">Assignment Summary</h3><div className="summary-grid"><div className="summary-item"><div className="summary-icon purple"><i className="fas fa-heading" /></div><div className="summary-content"><span className="summary-label">Title</span><span className="summary-value" id="summaryTitle">{title || "-"}</span></div></div><div className="summary-item"><div className="summary-icon green"><i className="fas fa-tag" /></div><div className="summary-content"><span className="summary-label">Topic</span><span className="summary-value" id="summaryTopic">{topic || "-"}</span></div></div><div className="summary-item"><div className="summary-icon orange"><i className="fas fa-signal" /></div><div className="summary-content"><span className="summary-label">Difficulty</span><span className="summary-value" id="summaryDifficulty">{difficulty || "-"}</span></div></div><div className="summary-item"><div className="summary-icon blue"><i className="fas fa-question" /></div><div className="summary-content"><span className="summary-label">Questions</span><span className="summary-value" id="summaryQuestions">{questions.length}</span></div></div><div className="summary-item"><div className="summary-icon pink"><i className="fas fa-calendar-alt" /></div><div className="summary-content"><span className="summary-label">Deadline</span><span className="summary-value" id="summaryDeadline">{deadline || "-"}</span></div></div></div><div className="summary-questions"><h4>Questions Preview</h4><div className="questions-preview" id="questionsPreview">{questions.map((q, i) => <div className="preview-question" key={i}><div className="preview-question-num">{i + 1}</div><span className="preview-question-title">{q.problemTitle || "Untitled Question"}</span><span className="preview-question-lang">{q.language || "N/A"}</span></div>)}</div></div></div><div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setStep(2)}><i className="fas fa-arrow-left" />Previous</button><button type="button" className="btn-primary btn-publish" onClick={publishAssignment} disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-paper-plane" /> {editId ? "Update Assignment" : "Save Assignment"}</>}</button></div></div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CreateAssignmentPage;
