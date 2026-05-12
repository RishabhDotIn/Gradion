import { useState, useMemo } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import "../styles/teacherSubmissions.css";

const MOCK_SUBMISSIONS = [
  {
    id: "s1",
    studentName: "Alex Rivera",
    studentEmail: "alex.rivera@example.com",
    assignmentTitle: "Advanced Data Structures",
    submittedAt: "2024-05-12T10:30:00Z",
    status: "Graded",
    score: 95,
    totalScore: 100,
    avatar: "https://ui-avatars.com/api/?name=Alex+Rivera&background=6366f1&color=fff"
  },
  {
    id: "s2",
    studentName: "Sarah Chen",
    studentEmail: "sarah.chen@university.edu",
    assignmentTitle: "Operating Systems Project",
    submittedAt: "2024-05-12T14:45:00Z",
    status: "Pending",
    score: null,
    totalScore: 100,
    avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=10b981&color=fff"
  },
  {
    id: "s3",
    studentName: "Marcus Thorne",
    studentEmail: "m.thorne@tech.com",
    assignmentTitle: "Advanced Data Structures",
    submittedAt: "2024-05-11T09:20:00Z",
    status: "Graded",
    score: 88,
    totalScore: 100,
    avatar: "https://ui-avatars.com/api/?name=Marcus+Thorne&background=f59e0b&color=fff"
  },
  {
    id: "s4",
    studentName: "Elena Rodriguez",
    studentEmail: "elena.r@example.com",
    assignmentTitle: "Database Normalization",
    submittedAt: "2024-05-10T16:15:00Z",
    status: "Graded",
    score: 92,
    totalScore: 100,
    avatar: "https://ui-avatars.com/api/?name=Elena+Rodriguez&background=ef4444&color=fff"
  },
  {
    id: "s5",
    studentName: "David Kim",
    studentEmail: "d.kim@university.edu",
    assignmentTitle: "Web Security Lab",
    submittedAt: "2024-05-12T11:10:00Z",
    status: "Pending",
    score: null,
    totalScore: 100,
    avatar: "https://ui-avatars.com/api/?name=David+Kim&background=8b5cf6&color=fff"
  },
  {
    id: "s6",
    studentName: "Jordan Smith",
    studentEmail: "j.smith@example.com",
    assignmentTitle: "Advanced Data Structures",
    submittedAt: "2024-05-11T13:40:00Z",
    status: "Late",
    score: 75,
    totalScore: 100,
    avatar: "https://ui-avatars.com/api/?name=Jordan+Smith&background=3b82f6&color=fff"
  }
];

function TeacherSubmissionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  
  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return { name: "Teacher", role: "Instructor" };
    try { return JSON.parse(userStr); } catch { return { name: "Teacher", role: "Instructor" }; }
  }, []);

  const filteredSubmissions = useMemo(() => {
    return MOCK_SUBMISSIONS.filter(s => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleOpenModal = (submission) => {
    setActiveSubmission(submission);
    setScoreInput(submission.score || "");
    setFeedbackText("");
    setShowFeedbackModal(true);
  };

  const handleCloseModal = () => {
    setShowFeedbackModal(false);
    setActiveSubmission(null);
  };

  const handleSendFeedback = () => {
    if (!activeSubmission) return;
    
    setIsSending(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Sending feedback for submission:", activeSubmission.id);
      console.log("Score:", scoreInput);
      console.log("Feedback:", feedbackText);
      
      setIsSending(false);
      handleCloseModal();
      
      // In a real app, we would update the local state or refetch data here
      alert(`Feedback sent successfully for ${activeSubmission.studentName}!`);
    }, 1000);
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getAvatarColor = (url) => {
    if (!url) return "#ff8a71";
    const match = url.match(/background=([^&]+)/);
    return match ? `#${match[1]}` : "#ff8a71";
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="submissions-page-content">
          <div className="page-header-alt">
            <div>
              <h1 className="page-title-alt">Student Submissions</h1>
              <p className="page-subtitle-alt">Manage and review all student assignment submissions</p>
            </div>
            <div className="header-actions">
              <button className="export-btn">
                <i className="fas fa-download"></i> Export Data
              </button>
            </div>
          </div>

          <div className="submissions-filters-card">
            <div className="search-wrapper">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search by student or assignment..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Status:</span>
              <div className="filter-chips">
                {["All", "Graded", "Pending", "Late"].map(status => (
                  <button 
                    key={status}
                    className={`filter-chip ${statusFilter === status ? "active" : ""}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="submissions-table-container">
            <div className="table-responsive">
              <table className="modern-submissions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Submitted At</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>
                          <div className="student-info-cell">
                            <img src={submission.avatar} alt={submission.studentName} className="student-avatar-small" />
                            <div className="student-details">
                              <span className="student-name-text">{submission.studentName}</span>
                              <span className="student-email-text">{submission.studentEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="assignment-cell">
                            <i className="fas fa-file-code"></i>
                            <span>{submission.assignmentTitle}</span>
                          </div>
                        </td>
                        <td>
                          <span className="date-text">{formatDate(submission.submittedAt)}</span>
                        </td>
                        <td>
                          <div className="score-cell">
                            {submission.score !== null ? (
                              <span className={`score-badge ${submission.score >= 90 ? "high" : submission.score >= 75 ? "medium" : "low"}`}>
                                {submission.score}/{submission.totalScore}
                              </span>
                            ) : (
                              <span className="score-pending">- / {submission.totalScore}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${submission.status.toLowerCase()}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button className="action-icon-btn view" title="View Submission">
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="action-icon-btn grade" 
                              title="Grade"
                              onClick={() => handleOpenModal(submission)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data-cell">
                        <div className="no-results">
                          <i className="fas fa-search"></i>
                          <p>No submissions found matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showFeedbackModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="feedback-modal compact" onClick={(e) => e.stopPropagation()}>
            <div className="compact-modal-header">
              <div className="student-profile-group">
                <div 
                  className="student-initials-avatar"
                  style={{ background: getAvatarColor(activeSubmission?.avatar) }}
                >
                  {getInitials(activeSubmission?.studentName)}
                </div>
                <div className="student-meta-info">
                  <h4>{activeSubmission?.studentName}</h4>
                  <p>ID: 2024001 • {activeSubmission?.assignmentTitle.split(" ")[0]} 101 - A</p>
                  <span className="submission-time-ago">Submitted 2 hours ago</span>
                </div>
              </div>
              <div className="status-badge-wrapper">
                <span className="on-time-badge">
                  <i className="fas fa-check-circle"></i> On Time
                </span>
              </div>
            </div>
            
            <div className="modal-body compact">
              <div className="form-group compact">
                <label htmlFor="feedback-text">Feedback</label>
                <textarea 
                  id="feedback-text"
                  placeholder="Provide constructive feedback to the student..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows="4"
                ></textarea>
              </div>

              <div className="notify-checkbox-group">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Notify student via email when graded
                </label>
              </div>
            </div>

            <div className="modal-footer compact">
              <button className="compact-cancel-btn" onClick={handleCloseModal}>Cancel</button>
              <button 
                className="compact-send-btn" 
                onClick={handleSendFeedback}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                  </>
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherSubmissionsPage;
