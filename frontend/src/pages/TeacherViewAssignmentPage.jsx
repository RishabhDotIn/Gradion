import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import '../styles/teacherDashboard.css';
import '../styles/teacherViewAssignment.css';

const TeacherViewAssignmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }, []);

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true);
      try {
        const response = await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS_TEACHER}/${id}`);
        setAssignment(response.assignment || null);
      } catch {
        setAssignment(null);
      }
      setLoading(false);
    };
    fetchAssignment();
  }, [id]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleDelete = () => setShowDeleteConfirm(true);
  const doDelete = async () => {
    setShowDeleteConfirm(false);
    await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS_TEACHER}/${id}`, "DELETE");
    navigate("/teacher-dashboard");
  };

  const handleEdit = () => {
    navigate(`/create-assignment?edit=${id}`);
  };

  if (loading) return <div className="dashboard-layout"><DashboardSidebar /><div className="dashboard-main">Loading...</div></div>;
  if (!assignment) return <div className="dashboard-layout"><DashboardSidebar /><div className="dashboard-main">Assignment not found.</div></div>;

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">
          <div className="view-assignment-content">
            <div className="view-assignment-header">
              <div className="view-assignment-header-top">
                <div>
                  <h1 className="view-assignment-title">{assignment.title}</h1>
                  <p className="view-assignment-desc">{assignment.description || "No description provided."}</p>
                </div>
                <div className={`view-assignment-status ${assignment.status?.toLowerCase() || 'draft'}`}>
                  {assignment.status === 'published' ? <i className="fas fa-check-circle" /> : <i className="fas fa-clock" />}
                  {assignment.status ? assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1) : 'Draft'}
                </div>
              </div>

              <div className="view-assignment-meta-grid">
                <div className="meta-box">
                  <div className="meta-icon green"><i className="fas fa-tag" /></div>
                  <div className="meta-details">
                    <span className="meta-label">Topic</span>
                    <span className="meta-value">{assignment.topic || "-"}</span>
                  </div>
                </div>
                <div className="meta-box">
                  <div className="meta-icon orange"><i className="fas fa-signal" /></div>
                  <div className="meta-details">
                    <span className="meta-label">Difficulty</span>
                    <span className="meta-value">{assignment.difficulty || "-"}</span>
                  </div>
                </div>
                <div className="meta-box">
                  <div className="meta-icon pink"><i className="fas fa-calendar-alt" /></div>
                  <div className="meta-details">
                    <span className="meta-label">Deadline</span>
                    <span className="meta-value">{assignment.deadline || "-"}</span>
                  </div>
                </div>
                <div className="meta-box">
                  <div className="meta-icon blue"><i className="fas fa-question-circle" /></div>
                  <div className="meta-details">
                    <span className="meta-label">Questions</span>
                    <span className="meta-value">{assignment.questions?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="questions-section">
              {(!assignment.questions || assignment.questions.length === 0) ? (
                <div className="view-question-card" style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#64748b' }}>No questions added to this assignment.</p>
                </div>
              ) : (
                assignment.questions.map((q, idx) => (
                  <div key={idx} className="view-question-card">
                    <div className="vq-header">
                      <h3 className="vq-title">
                        <span className="vq-number">Q{idx + 1}</span>
                        {q.problemTitle || "Untitled Question"}
                      </h3>
                      {q.language && (
                        <div className="vq-language">
                          <i className="fas fa-code" /> {q.language}
                        </div>
                      )}
                    </div>

                    <div className="vq-block">
                      <h4>Description</h4>
                      <p>{q.problemDescription || "No description."}</p>
                    </div>

                    {(q.constraints || q.examples) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                        {q.constraints && (
                          <div className="vq-block" style={{ marginBottom: 0 }}>
                            <h4>Constraints</h4>
                            <p>{q.constraints}</p>
                          </div>
                        )}
                        {q.examples && (
                          <div className="vq-block" style={{ marginBottom: 0 }}>
                            <h4>Examples</h4>
                            <p>{q.examples}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {q.starterCode && (
                      <div className="vq-block">
                        <h4>Starter Code</h4>
                        <pre className="vq-code"><code>{q.starterCode}</code></pre>
                      </div>
                    )}

                    {q.testCases && q.testCases.length > 0 && (
                      <div className="vq-block">
                        <h4>Test Cases</h4>
                        <div className="vq-testcases">
                          {q.testCases.map((tc, tcIdx) => (
                            <div key={tcIdx} className="vq-testcase">
                              <div className="vq-testcase-header">Test Case {tcIdx + 1}</div>
                              <div className="vq-io">
                                <div className="vq-io-item">
                                  <span>Input:</span>
                                  <code>{tc.input || "-"}</code>
                                </div>
                                <div className="vq-io-item">
                                  <span>Output:</span>
                                  <code>{tc.output || "-"}</code>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="view-assignment-actions">
              <button className="btn-delete" onClick={handleDelete}>
                <i className="fas fa-trash" /> Delete Assignment
              </button>
              <button className="btn-edit" onClick={handleEdit}>
                <i className="fas fa-pen" /> Edit Assignment
              </button>
            </div>
            {/* Confirm modal for deletion */}
            {showDeleteConfirm && (
              <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setShowDeleteConfirm(false)}>
                <div className="invite-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                  <div className="modal-header">
                    <h3>Delete Assignment</h3>
                    <button type="button" className="close-modal" onClick={() => setShowDeleteConfirm(false)}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                  <div className="modal-body">
                    <p style={{ color: '#475569' }}>Are you sure you want to delete this assignment? This action cannot be undone.</p>
                    <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                      <button type="button" className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                      <button type="button" className="send-btn" onClick={doDelete}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherViewAssignmentPage;
