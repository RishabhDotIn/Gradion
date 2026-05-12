import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import '../styles/assignmentLanding.css';

const AssignmentLandingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [submittedQuestions, setSubmittedQuestions] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(false);

    const user = useMemo(() => {
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch { return null; }
    }, []);

    useEffect(() => {
        const loadAssignment = async () => {
            try {
                const response = await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENT_PUBLIC_BY_ID}/${id}`);
                if (response.success) {
                    setAssignment(response.assignment);
                    const progress = JSON.parse(localStorage.getItem(`gradion_progress_${id}`) || "{}");
                    setSubmittedQuestions(progress);
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

    const handleSolve = (qIdx) => {
        navigate(`/assignment/${id}/editor/${qIdx}`);
    };

    const handleSubmitAssignment = () => {
        const confirmed = window.confirm("Are you sure you want to submit the final assignment? You won't be able to modify your answers after this.");
        if (confirmed) {
            alert("Assignment Submitted Successfully!");
            navigate('/student-assignments');
        }
    };

    if (!assignment) return <div className="loading-screen">Loading Assignment...</div>;

    return (
        <div className={`assignment-landing-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
            <nav className="editor-navbar">
                <div className="nav-left">
                    <div className="nav-logo">
                        <div className="logo-icon">
                            <i className="fas fa-graduation-cap" />
                        </div>
                        <span className="logo-text">Gradion</span>
                    </div>
                    <button className="nav-dashboard-btn" onClick={() => navigate('/student-assignments')}>
                        <i className="fas fa-th-large"></i>
                    </button>
                    <div className="nav-divider" />
                    <span className="nav-assignment-title">{assignment.title}</span>
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

            <div className="landing-content">
                <div className="landing-header-card">
                    <div className="landing-meta">
                        <span className="meta-pill">{assignment.topic || "General"}</span>
                        <span className="meta-pill difficulty">{assignment.difficulty || "Medium"}</span>
                        <span className="meta-pill">Due: {assignment.deadline || "TBA"}</span>
                    </div>
                    <h1 className="landing-title">{assignment.title || "Untitled Assignment"}</h1>
                    <p className="landing-description">{assignment.description || "No description provided for this assignment."}</p>
                </div>

                <div className="questions-section">
                    <div className="section-header">
                        <h2>Questions</h2>
                        <span className="progress-text">{Object.keys(submittedQuestions).length} / {assignment.questions.length} Completed</span>
                    </div>

                    <div className="questions-list">
                        {assignment.questions.map((q, idx) => {
                            const isSubmitted = submittedQuestions[idx];
                            return (
                                <div className="question-row" key={idx} onClick={() => handleSolve(idx)}>
                                    <div className="q-left">
                                        <div className="q-index">{idx + 1}</div>
                                        <div className="q-info">
                                            <h3>{q.title || q.problemTitle || `Question ${idx + 1}`}</h3>
                                            <p>{q.difficulty || 'Easy'}</p>
                                        </div>
                                    </div>
                                    <div className="q-right">
                                        <button className={`solve-btn ${isSubmitted ? 'submitted' : ''}`}>
                                            {isSubmitted ? 'Modify Answer' : 'Solve'}
                                            <i className={`fas ${isSubmitted ? 'fa-edit' : 'fa-chevron-right'}`} style={{ marginLeft: '10px' }} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="landing-footer">
                    <button className="submit-assignment-final-btn" onClick={handleSubmitAssignment}>
                        Submit Final Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentLandingPage;
