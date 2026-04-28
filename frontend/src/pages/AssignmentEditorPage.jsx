/* filepath: c:\Users\IRFAN\Desktop\GradionPro\Gradion\frontend\src\pages\AssignmentEditorPage.jsx */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import '../styles/assignmentEditor.css';

const AssignmentEditorPage = () => {
    const { id, qIdx } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(parseInt(qIdx) || 0);
    const [activeTestTab, setActiveTestTab] = useState('testcases');
    const [activeCaseIdx, setActiveCaseIdx] = useState(0);
    const [codes, setCodes] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Panel states (percentages or pixels)
    const [leftWidth, setLeftWidth] = useState(40); // percentage
    const [editorHeight, setEditorHeight] = useState(65); // percentage

    const isResizingH = useRef(false);
    const isResizingV = useRef(false);

    const user = useMemo(() => {
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch { return null; }
    }, []);

    useEffect(() => {
        // Load assignment from localStorage or Mock
        const mockData = [
            { id: 1, title: "Data Structures Midterm Report", topic: "Data Structures", difficulty: "Medium", deadline: "Oct 24, 2026", questions: [
                { 
                    problemTitle: "Longest Palindromic Substring", 
                    problemDescription: "Given a string s, return the longest palindromic substring in s. A palindrome is a string that reads the same forward and backward.",
                    difficulty: "Medium",
                    constraints: "1 <= s.length <= 1000\ns consists of only digits and English letters.",
                    starterCode: "public class Solution {\n    public String longestPalindrome(String s) {\n        // TODO: Implement logic\n        return \"\";\n    }\n}",
                    language: "java",
                    testCases: [
                        { input: "s = \"babad\"", output: "\"bab\"" },
                        { input: "s = \"cbbd\"", output: "\"bb\"" }
                    ]
                }
            ]},
        ];

        const stored = JSON.parse(localStorage.getItem("gradion_assignments") || "[]");
        const allAssignments = [...mockData, ...stored];
        const found = allAssignments.find(a => a.id.toString() === id.toString());

        if (found) {
            setAssignment(found);
            if (found.questions) {
                const initialCodes = {};
                found.questions.forEach((q, idx) => {
                    initialCodes[idx] = q.starterCode || "";
                });
                setCodes(initialCodes);
            }
        } else {
            navigate('/student-assignments');
        }
    }, [id, navigate]);

    // Resize Handlers
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingH.current) {
                const newWidth = (e.clientX / window.innerWidth) * 100;
                if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
            }
            if (isResizingV.current) {
                const editorPanel = document.querySelector('.editor-panel');
                if (editorPanel) {
                    const rect = editorPanel.getBoundingClientRect();
                    const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
                    if (newHeight > 20 && newHeight < 85) setEditorHeight(newHeight);
                }
            }
        };

        const handleMouseUp = () => {
            isResizingH.current = false;
            isResizingV.current = false;
            document.body.style.cursor = 'default';
            document.body.classList.remove('no-select');
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizingH = () => {
        isResizingH.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('no-select');
    };

    const startResizingV = () => {
        isResizingV.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.classList.add('no-select');
    };

    const handleEditorChange = (value) => {
        setCodes(prev => ({ ...prev, [currentQuestionIdx]: value }));
    };

    const handleQuestionSubmit = () => {
        // Mark as submitted in localStorage
        const progress = JSON.parse(localStorage.getItem(`gradion_progress_${id}`) || "{}");
        progress[currentQuestionIdx] = true;
        localStorage.setItem(`gradion_progress_${id}`, JSON.stringify(progress));

        alert("Question Submitted!");

        // If it's the last question, redirect to landing page
        if (currentQuestionIdx === assignment.questions.length - 1) {
            navigate(`/assignment/${id}`);
        } else {
            // Optional: Auto-move to next question
            setCurrentQuestionIdx(prev => prev + 1);
            setActiveCaseIdx(0);
        }
    };

    const currentQuestion = useMemo(() => {
        return assignment?.questions?.[currentQuestionIdx] || null;
    }, [assignment, currentQuestionIdx]);

    if (!assignment || !currentQuestion) return <div className="loading-screen">Loading Editor...</div>;

    return (
        <div className={`editor-page-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
            <nav className="editor-navbar">
                <div className="nav-left">
                    <div className="nav-logo">
                        <div className="logo-icon">
                            <i className="fas fa-graduation-cap" />
                        </div>
                        <span className="logo-text" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Gradion</span>
                    </div>
                    <button className="nav-dashboard-btn" onClick={() => navigate('/student-assignments')} title="Back to Assignments">
                        <i className="fas fa-th-large"></i>
                    </button>
                    <div className="nav-divider" />
                    <div className="nav-assignment-info">
                        <span className="nav-assignment-title">{assignment.title}</span>
                    </div>
                    <div className="nav-question-nav">
                        <button 
                            className="q-nav-btn" 
                            disabled={currentQuestionIdx === 0}
                            onClick={() => {
                                setCurrentQuestionIdx(prev => prev - 1);
                                setActiveCaseIdx(0);
                            }}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="q-nav-indicator">
                            Question {currentQuestionIdx + 1} / {assignment.questions.length}
                        </div>
                        <button 
                            className="q-nav-btn" 
                            disabled={currentQuestionIdx === assignment.questions.length - 1}
                            onClick={() => {
                                setCurrentQuestionIdx(prev => prev + 1);
                                setActiveCaseIdx(0);
                            }}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <div className="nav-right">
                    <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
                        <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    <div className="nav-user">
                        <img 
                            src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.name || "User")} 
                            alt="User" 
                            className="nav-avatar" 
                        />
                        <span className="nav-username">{user?.name || "Student"}</span>
                    </div>
                </div>
            </nav>

            <div className="editor-main-content">
                {/* Problem Panel */}
                <div className="problem-panel" style={{ width: `${leftWidth}%` }}>
                    <div className="problem-header">
                        <div className="problem-meta">
                            <span className={`meta-badge ${currentQuestion.difficulty?.toLowerCase() || 'medium'}`}>
                                {currentQuestion.difficulty || 'Medium'}
                            </span>
                            <span className="meta-time">
                                <i className="far fa-clock" /> 45 mins limit
                            </span>
                        </div>
                        <h1 className="problem-title">{currentQuestion.problemTitle}</h1>
                    </div>

                    <div className="problem-description">
                        {currentQuestion.problemDescription}
                    </div>

                    <span className="section-label">Constraints</span>
                    <div className="constraints-box">
                        <ul className="constraints-list">
                            {currentQuestion.constraints?.split('\n').map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
                        </ul>
                    </div>

                    <span className="section-label">Examples</span>
                    <div className="examples-list">
                        {currentQuestion.testCases?.map((tc, i) => (
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

                </div>

                {/* Horizontal Resizer */}
                <div className="resizer-h" onMouseDown={startResizingH} />

                {/* Editor Panel */}
                <div className="editor-panel" style={{ width: `${100 - leftWidth}%` }}>
                    <div className="editor-section-top" style={{ height: `${editorHeight}%` }}>
                        <div className="editor-header">
                            <div className="editor-controls-left">
                                <select className="lang-select">
                                    <option>{currentQuestion.language || 'Java'}</option>
                                    <option>Python 3</option>
                                    <option>C++</option>
                                </select>
                                <span className="autosave-badge">AUTO-SAVE: ON</span>
                            </div>
                            <div className="editor-controls-right">
                                <span className="attempt-count">ATTEMPTS REMAINING: 3/5</span>
                                <i className="fas fa-cog" style={{ cursor: 'pointer' }} />
                            </div>
                        </div>

                        <div className="code-area-wrapper">
                            <Editor
                                key={`${currentQuestionIdx}-${id}`}
                                height="100%"
                                language={currentQuestion.language?.toLowerCase() || "java"}
                                defaultValue={codes[currentQuestionIdx] || ""}
                                theme={isDarkMode ? "vs-dark" : "light"}
                                onChange={handleEditorChange}
                                options={{
                                    fontSize: 16,
                                    lineNumbers: 'on',
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    roundedSelection: true,
                                    padding: { top: 20 },
                                    formatOnPaste: true,
                                    formatOnType: true,
                                    autoClosingBrackets: 'always',
                                    autoClosingQuotes: 'always',
                                    tabSize: 4,
                                    cursorBlinking: 'smooth',
                                    smoothScrolling: true
                                }}
                            />
                        </div>
                    </div>

                    {/* Vertical Resizer */}
                    <div className="resizer-v" onMouseDown={startResizingV} />

                    {/* Test Panel */}
                    <div className="test-panel" style={{ height: `${100 - editorHeight}%` }}>
                        <div className="test-header">
                            <div 
                                className={`test-tab ${activeTestTab === 'testcases' ? 'active' : ''}`}
                                onClick={() => setActiveTestTab('testcases')}
                            >
                                Test Cases
                            </div>
                            <div 
                                className={`test-tab ${activeTestTab === 'results' ? 'active' : ''}`}
                                onClick={() => setActiveTestTab('results')}
                            >
                                Test Results
                            </div>
                            <div 
                                className={`test-tab ${activeTestTab === 'console' ? 'active' : ''}`}
                                onClick={() => setActiveTestTab('console')}
                            >
                                <i className="fas fa-terminal" style={{ fontSize: '11px', marginRight: '6px' }} /> Console
                            </div>

                            <div className="footer-actions">
                                <button className="btn-run-editor">
                                    <i className="fas fa-play" /> Run
                                </button>
                                <button className="btn-submit-editor" onClick={handleQuestionSubmit}>
                                    <i className="fas fa-rocket" /> Submit
                                </button>
                            </div>
                        </div>
                        <div className="test-body">
                            {activeTestTab === 'testcases' ? (
                                <>
                                    <div className="test-case-nav">
                                        {currentQuestion.testCases?.map((_, idx) => (
                                            <button 
                                                key={idx} 
                                                className={`case-btn ${activeCaseIdx === idx ? 'active' : ''}`}
                                                onClick={() => setActiveCaseIdx(idx)}
                                            >
                                                Case {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="case-content">
                                        <span className="case-input-label">Input</span>
                                        <div className="case-input-box">
                                            {currentQuestion.testCases?.[activeCaseIdx]?.input || "N/A"}
                                        </div>
                                        
                                        <span className="case-input-label" style={{ marginTop: '20px' }}>Expected Output</span>
                                        <div className="case-input-box">
                                            {currentQuestion.testCases?.[activeCaseIdx]?.output || "N/A"}
                                        </div>
                                    </div>
                                </>
                            ) : activeTestTab === 'results' ? (
                                <div className="results-placeholder" style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>
                                    <i className="fas fa-terminal" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }} />
                                    Run your code to see results
                                </div>
                            ) : (
                                <div className="console-placeholder" style={{ color: '#94a3b8', fontFamily: 'Fira Code, monospace', fontSize: '13px' }}>
                                    {"> "} Console initialized...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentEditorPage;
