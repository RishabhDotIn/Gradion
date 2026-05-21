import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import "../styles/teacherSubmissions.css";

function TeacherSubmissionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0, limit: 10 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [statusInput, setStatusInput] = useState("Graded");
  const [isSending, setIsSending] = useState(false);

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return { fullName: "Teacher", role: "Instructor" };
    try {
      return JSON.parse(userStr);
    } catch {
      return { fullName: "Teacher", role: "Instructor" };
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (assignmentFilter && assignmentFilter !== 'all') params.set('assignment', assignmentFilter);
      const data = await apiCall(`${API_CONFIG.ENDPOINTS.SUBMISSIONS}/teacher?${params.toString()}`);
      setRows(data.submissions || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (e) {
      toast.error(e.message || "Failed to load submissions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // load assignments for filter
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await apiCall(API_CONFIG.ENDPOINTS.TEACHER_ASSIGNMENTS);
        if (!mounted) return;
        const items = (resp.assignments || []).map((a) => ({ id: a._id, title: a.title }));
        setAssignmentsList(items);
      } catch {
        setAssignmentsList([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filteredSubmissions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rows.filter((s) => {
      const name = (s.student && s.student.fullName) || "";
      const email = (s.student && s.student.email) || "";
      const title = (s.assignment && s.assignment.title) || "";
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || title.toLowerCase().includes(q);
    });
  }, [rows, searchTerm]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleOpenModal = (submission) => {
    setActiveSubmission(submission);
    setScoreInput(submission.score != null ? String(submission.score) : "");
    setStatusInput(submission.status || "Graded");
    setFeedbackText(submission.teacherFeedback || "");
    setShowFeedbackModal(true);
  };

  const handleCloseModal = () => {
    setShowFeedbackModal(false);
    setActiveSubmission(null);
  };

  const handleSendFeedback = async () => {
    if (!activeSubmission) return;
    setIsSending(true);
    try {
      await apiCall(`${API_CONFIG.ENDPOINTS.SUBMISSIONS}/teacher/${activeSubmission._id}`, "PATCH", {
        score: scoreInput === "" ? undefined : Number(scoreInput),
        status: statusInput,
        teacherFeedback: feedbackText,
      });
      toast.success("Submission updated.");
      handleCloseModal();
      await load();
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarFor = (name, email) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "S")}&background=6366f1&color=fff`;

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="submissions-page-content">
          <div className="page-header-alt">
            <div>
              <h1 className="page-title-alt">Student Submissions</h1>
              <p className="page-subtitle-alt">AI-assisted grading with plagiarism signals — override scores when needed</p>
            </div>
          </div>

          <div className="submissions-filters-card">
            <div className="search-wrapper">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search by student or assignment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group filter-group-status">
              <span className="filter-label">Status:</span>
              <div className="filter-chips-scroll">
                <div className="filter-chips">
                  {["All", "Graded", "Pending", "Late", "Failed"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`filter-chip ${statusFilter === status ? "active" : ""}`}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="filter-group filter-group-assignment">
              <span className="filter-label">Assignment:</span>
              <select className="filter-select" value={assignmentFilter} onChange={(e) => { setAssignmentFilter(e.target.value); setPage(1); }}>
                <option value="all">All assignments</option>
                {assignmentsList.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="submissions-table-container">
            <div className="table-responsive">
              <table className="modern-submissions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Class</th>
                    <th>Submitted At</th>
                    <th>Score</th>
                    <th>Plagiarism</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="no-data-cell">
                        <div className="no-results">
                          <i className="fas fa-spinner fa-spin" />
                          <p>Loading submissions…</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((submission) => {
                      const name = (submission.student && submission.student.fullName) || "Student";
                      const email = (submission.student && submission.student.email) || "";
                      const title = (submission.assignment && submission.assignment.title) || "—";
                      const className =
                        submission.assignment &&
                        submission.assignment.classId &&
                        typeof submission.assignment.classId === "object"
                          ? submission.assignment.classId.name
                          : "—";
                      const plag = submission.plagiarismScore ?? 0;
                      const plagHigh = plag > 80;
                      return (
                        <tr key={submission._id}>
                          <td>
                            <div className="student-info-cell">
                              <img src={avatarFor(name, email)} alt="" className="student-avatar-small" />
                              <div className="student-details">
                                <span className="student-name-text">{name}</span>
                                <span className="student-email-text">{email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="assignment-cell">
                              <i className="fas fa-file-code" />
                              <span>{title}</span>
                            </div>
                          </td>
                          <td>{className}</td>
                          <td>
                            <span className="date-text">{formatDate(submission.submittedAt || submission.createdAt)}</span>
                          </td>
                          <td>
                            <div className="score-cell">
                              {submission.score != null ? (
                                <span
                                  className={`score-badge ${
                                    submission.score >= 90 ? "high" : submission.score >= 75 ? "medium" : "low"
                                  }`}
                                >
                                  {submission.score}
                                  <span>/100</span>
                                </span>
                              ) : (
                                <span className="score-pending">—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`plag-pill ${plagHigh ? 'high' : ''}`}
                              title={submission.plagiarismExplanation || ""}
                              style={plagHigh ? { background: "#fee2e2", color: "#b91c1c", fontWeight: 700 } : undefined}
                            >
                              {plag}%
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${(submission.status || "").toLowerCase()}`}>
                              {submission.status}
                            </span>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button
                                type="button"
                                className="action-icon-btn grade"
                                title="Grade / override"
                                onClick={() => handleOpenModal(submission)}
                              >
                                <i className="fas fa-edit" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data-cell">
                        <div className="no-results">
                          <i className="fas fa-search" />
                          <p>No submissions found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!loading && pagination.pages > 1 ? (
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", padding: "16px" }}>
                <button type="button" className="filter-chip" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span style={{ alignSelf: "center" }}>
                  Page {page} / {pagination.pages}
                </span>
                <button
                  type="button"
                  className="filter-chip"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {showFeedbackModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="feedback-modal compact" onClick={(e) => e.stopPropagation()}>
            <div className="compact-modal-header">
              <div className="student-profile-group">
                <div className="student-initials-avatar" style={{ background: "#6366f1" }}>
                  {getInitials(activeSubmission?.student?.fullName)}
                </div>
                <div className="student-meta-info">
                  <h4>{activeSubmission?.student?.fullName}</h4>
                  <p>{activeSubmission?.assignment?.title}</p>
                  <span className="submission-time-ago">
                    Plagiarism score: {activeSubmission?.plagiarismScore ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-body compact">
              <div className="form-group compact">
                <label htmlFor="grade-score">Score (0–100)</label>
                <input
                  id="grade-score"
                  type="number"
                  min={0}
                  max={100}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                />
              </div>
              <div className="form-group compact">
                <label htmlFor="grade-status">Status</label>
                <select id="grade-status" value={statusInput} onChange={(e) => setStatusInput(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Graded">Graded</option>
                  <option value="Late">Late</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div className="form-group compact">
                <label htmlFor="feedback-text">Teacher feedback (optional)</label>
                <textarea
                  id="feedback-text"
                  placeholder="Notes for the student (does not replace AI feedback)…"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                />
              </div>
              <p style={{ fontSize: "12px", color: "#64748b" }}>
                AI feedback (read-only): {(activeSubmission && activeSubmission.aiFeedback) || "—"}
              </p>
            </div>

            <div className="modal-footer compact">
              <button type="button" className="compact-cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button type="button" className="compact-send-btn" onClick={handleSendFeedback} disabled={isSending}>
                {isSending ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherSubmissionsPage;
