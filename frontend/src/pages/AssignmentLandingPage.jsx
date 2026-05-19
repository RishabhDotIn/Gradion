import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import '../styles/assignmentLanding.css';
import ConfirmModal from '../components/common/ConfirmModal.jsx';

const AssignmentLandingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [submittedQuestions, setSubmittedQuestions] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [canSubmit, setCanSubmit] = useState(true);
    const [pageLoading, setPageLoading] = useState(true);

    const user = useMemo(() => {
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch { return null; }
    }, []);

    const getProgressKey = useCallback((assignmentId, studentId) => {
        return studentId ? `gradion_progress_${studentId}_${assignmentId}` : `gradion_progress_${assignmentId}`;
    }, []);

    useEffect(() => {
        const loadAssignment = async () => {
            setPageLoading(true);
            try {
                const token = sessionStorage.getItem('token');
                const endpoint = token
                    ? `${API_CONFIG.ENDPOINTS.ASSIGNMENTS_STUDENT}/${id}`
                    : `${API_CONFIG.ENDPOINTS.ASSIGNMENT_PUBLIC_BY_ID}/${id}`;
                const response = await apiCall(endpoint);
                if (response.success) {
                    setAssignment(response.assignment);
                    setCanSubmit(response.canSubmit !== false);
                    const progress = {};
                    if (token) {
                        try {
                            const subs = await apiCall(`${API_CONFIG.ENDPOINTS.SUBMISSIONS}/student?assignmentId=${id}`);
                            (subs.submissions || []).forEach((s) => {
                                progress[s.questionIndex] = true;
                            });
                        } catch {
                            /* ignore */
                        }
                    } else {
                        const key = getProgressKey(id, user?._id || user?.id);
                        Object.assign(progress, JSON.parse(localStorage.getItem(key) || "{}"));
                    }
                    setSubmittedQuestions(progress);
                } else {
                    navigate('/student-assignments');
                }
            } catch (error) {
                console.error('Failed to load assignment:', error);
                toast.error(error.message || 'Failed to load assignment');
                navigate('/student-assignments');
            } finally {
                setPageLoading(false);
            }
        };

        loadAssignment();
    }, [id, navigate, getProgressKey, user?._id, user?.id]);

    const handleSolve = (qIdx) => {
        navigate(`/assignment/${id}/editor/${qIdx}`);
    };

    const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
    const handleSubmitAssignment = () => setShowSubmitConfirm(true);
    const doSubmitAssignment = () => {
        setShowSubmitConfirm(false);
        toast.success('Assignment Submitted Successfully!');
        navigate('/student-assignments');
    };

    if (pageLoading || !assignment) {
        return (
            <div className={`assignment-landing-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
                <nav className="editor-navbar" aria-busy="true">
                    <div className="nav-left">
                        <div className="nav-logo">
                            <div className="logo-icon">
                                <i className="fas fa-graduation-cap" />
                            </div>
                            <span className="logo-text">Gradion</span>
                        </div>
                        <button type="button" className="nav-dashboard-btn" onClick={() => navigate('/student-assignments')} title="Back to assignments">
                            <i className="fas fa-th-large" />
                        </button>
                        <div className="nav-divider" />
                        <span className="nav-assignment-title assignment-loading-nav-title">Preparing workspace…</span>
                    </div>
                    <div className="nav-right">
                        <button type="button" className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle theme">
                            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} />
                        </button>
                        <div className="nav-user">
                            <img
                                src={user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.fullName || 'User')}
                                alt=""
                                className="nav-avatar"
                            />
                            <span className="nav-username">{user?.fullName || 'Student'}</span>
                        </div>
                    </div>
                </nav>

                <div className="assignment-loading-main">
                    <div className="assignment-loading-card" role="status" aria-live="polite">
                        <div className="assignment-loading-spinner" aria-hidden />
                        <h1 className="assignment-loading-heading">Loading assignment</h1>
                        <p className="assignment-loading-sub">Fetching instructions and your progress…</p>
                        <div className="assignment-loading-skeleton" aria-hidden>
                            <div className="sk-line sk-line--long" />
                            <div className="sk-line sk-line--med" />
                            <div className="sk-line sk-line--short" />
                            <div className="sk-blocks">
                                <div className="sk-block" />
                                <div className="sk-block" />
                                <div className="sk-block" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            src={user?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.fullName || "User")} 
                            alt="User" 
                            className="nav-avatar" 
                        />
                        <span className="nav-username">{user?.fullName || "Student"}</span>
                    </div>
                </div>
            </nav>

            <div className="landing-content">
                <div className="landing-header-card">
                    <div className="landing-meta">
                        <span className="meta-pill">{assignment.topic || "General"}</span>
                        <span className="meta-pill difficulty">{assignment.difficulty || "Medium"}</span>
                        <span className="meta-pill">Due: {assignment.deadline || "TBA"}</span>
                        {!canSubmit ? <span className="meta-pill" style={{ background: '#fef3c7', color: '#92400e' }}>Closed</span> : null}
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
                <ConfirmModal
                    isOpen={showSubmitConfirm}
                    title="Submit Assignment"
                    message={`Are you sure you want to submit the final assignment? You won't be able to modify your answers after this.`}
                    confirmText="Submit"
                    cancelText="Cancel"
                    onConfirm={doSubmitAssignment}
                    onCancel={() => setShowSubmitConfirm(false)}
                />
            </div>
        </div>
    );
};

export default AssignmentLandingPage;
