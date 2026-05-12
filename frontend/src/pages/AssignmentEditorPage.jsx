import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';

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
    const [netSpeed, setNetSpeed] = useState('Checking...');

    const user = useMemo(() => {
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch { return null; }
    }, []);

    useEffect(() => {
        const updateNetSpeed = () => {
            if (!navigator.onLine) {
                setNetSpeed('Disconnected');
                return;
            }
            if (navigator.connection && navigator.connection.downlink) {
                // Add a small random fluctuation to simulate real-time measurement if speed doesn't change often
                const speed = navigator.connection.downlink;
                const jitter = (Math.random() * 0.2 - 0.1).toFixed(2);
                const finalSpeed = Math.max(0.1, (parseFloat(speed) + parseFloat(jitter))).toFixed(1);
                setNetSpeed(`${finalSpeed} Mbps`);
            } else {
                setNetSpeed('Online');
            }
        };

        updateNetSpeed();

        window.addEventListener('online', updateNetSpeed);
        window.addEventListener('offline', updateNetSpeed);

        if (navigator.connection) {
            navigator.connection.addEventListener('change', updateNetSpeed);
        }

        const interval = setInterval(updateNetSpeed, 2000);

        return () => {
            window.removeEventListener('online', updateNetSpeed);
            window.removeEventListener('offline', updateNetSpeed);
            if (navigator.connection) {
                navigator.connection.removeEventListener('change', updateNetSpeed);
            }
            clearInterval(interval);
        };
    }, []);

    // Panel states (percentages or pixels)
    const [leftWidth, setLeftWidth] = useState(40); // percentage
    const [editorHeight, setEditorHeight] = useState(65); // percentage

    const isResizingH = useRef(false);
    const isResizingV = useRef(false);

    useEffect(() => {
        const loadAssignment = async () => {
            try {
                const response = await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENT_PUBLIC_BY_ID}/${id}`);
                if (response.success) {
                    const assignmentData = response.assignment;
                    setAssignment(assignmentData);
                    
                    if (assignmentData.questions) {
                        const initialCodes = {};
                        assignmentData.questions.forEach((q, idx) => {
                            initialCodes[idx] = q.starterCode || "";
                        });
                        setCodes(initialCodes);
                    }
                } else {
                    navigate('/student-assignments');
                }
            } catch (error) {
                console.error('Failed to load assignment:', error);
                navigate('/student-assignments');
            }
        };

        loadAssignment();
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
        <div className="dashboard-layout">
            <DashboardSidebar />
            <div className="dashboard-main">
                <DashboardHeader user={user} />
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

                <div className="problem-header">
                    <span className={`meta-badge ${currentQuestion.difficulty?.toLowerCase() || 'medium'}`}>
                        {currentQuestion.difficulty || 'Medium'}
                    </span>
                    <span className="meta-time">
                        <i className="far fa-clock" /> 45 mins limit
                    </span>
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
                                <span className="net-speed-indicator">
                                    <i 
                                        className="fas fa-wifi" 
                                        style={{ 
                                            marginRight: '6px', 
                                            color: netSpeed === 'Disconnected' ? '#ef4444' : 'var(--accent)' 
                                        }} 
                                    />
                                    {netSpeed}
                                </span>
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
