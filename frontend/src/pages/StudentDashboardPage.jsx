import { useMemo, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import StudentStats from "../components/dashboard/StudentStats.jsx";
import PerformanceCard from "../components/dashboard/PerformanceCard.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import { STUDENT_MENU_ITEMS } from "../nav/studentMenu.js";
import "../styles/teacherDashboard.css";
import "../styles/studentDashboard.css";
import "../styles/teacherStudents.css";

function StudentDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    averageScore: "0%",
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }, []);

  const loadData = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    setLoading(true);
    const results = await Promise.allSettled([
      apiCall(API_CONFIG.ENDPOINTS.DASHBOARD_STUDENT),
      apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS_STUDENT}?limit=8`),
      apiCall(`${API_CONFIG.ENDPOINTS.SUBMISSIONS}/student`),
    ]);

    const dash = results[0].status === "fulfilled" ? results[0].value : null;
    const assigns = results[1].status === "fulfilled" ? results[1].value : null;
    const subs = results[2].status === "fulfilled" ? results[2].value : null;

    if (dash) {
      setStats({
        totalAssignments: dash.totalAssignments ?? 0,
        completedAssignments: dash.completedAssignments ?? 0,
        pendingAssignments: dash.pendingAssignments ?? 0,
        averageScore: `${Math.round(dash.averageScore ?? 0)}%`,
        previousWeek: dash.previousWeek || null,
      });
    }

    const raw = assigns?.assignments || [];
    setUpcomingAssignments(
      raw.slice(0, 6).map((a) => ({
        id: a._id,
        title: a.title,
        deadline: a.deadline ? new Date(a.deadline).toLocaleDateString() : "",
        status: a.deadline ? (new Date(a.deadline) > new Date() ? "Open" : "Closed") : "Open",
        className: a.classId?.name || "",
      }))
    );

    const subRows = subs?.submissions || [];
    setRecentSubmissions(
      subRows.slice(0, 5).map((s) => ({
        id: s._id,
        title: s.assignment?.title || "Assignment",
        score: s.score != null ? `${s.score}/100` : "—",
        status: s.status || "Pending",
        submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "",
      }))
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length && !silent) {
      const firstMsg = failed[0].reason?.message || "Request failed";
      const network =
        typeof firstMsg === "string" &&
        (firstMsg === "Failed to fetch" || firstMsg.includes("NetworkError") || firstMsg.includes("fetch"));
      if (failed.length === results.length) {
        toast.error(
          network
            ? "Cannot reach the API. In dev: run the backend on port 5000 and use Vite (npm run dev) so /api is proxied."
            : firstMsg,
          { id: "student-dashboard-network" }
        );
      } else if (failed.length > 0) {
        toast.error("Some dashboard data could not be loaded.", { id: "student-dashboard-network" });
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const studentMenuItems = STUDENT_MENU_ITEMS;

  

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={studentMenuItems} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">
          {/* Classes toolbar removed: dashboard focuses on analytics only */}

          

          {loading ? (
            <div className="dashboard-stats" style={{ opacity: 0.65 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="dashboard-stat-card" style={{ minHeight: "110px" }}>
                  <div className="stat-content">
                    <span className="stat-label">Loading…</span>
                    <span className="stat-value">
                      <i className="fas fa-spinner fa-spin" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StudentStats stats={stats} />
          )}

          <div className="dashboard-grid-content">
            <PerformanceCard />
            <ProfileCard user={user} />
          </div>

          <section className="upcoming-assignments-section">
            <div className="section-header">
              <h3 className="section-title">Upcoming assignments</h3>
              <button type="button" className="view-all-btn" onClick={() => navigate("/student-assignments")}>
                View all
              </button>
            </div>

            <div className="assignments-table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Class</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                        <i className="fas fa-spinner fa-spin" /> Loading…
                      </td>
                    </tr>
                  ) : upcomingAssignments.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                        No assignments yet.
                      </td>
                    </tr>
                  ) : (
                    upcomingAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>
                          <div className="assignment-title-cell">
                            <div className="assignment-icon">
                              <i className="fas fa-file-alt" />
                            </div>
                            <span>{assignment.title}</span>
                          </div>
                        </td>
                        <td>{assignment.className || "—"}</td>
                        <td>{assignment.deadline}</td>
                        <td>
                          <span className={`status-badge ${assignment.status.toLowerCase()}`}>{assignment.status}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="action-btn primary"
                            onClick={() => navigate(`/assignment/${assignment.id}`)}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="recent-submissions-section">
            <div className="section-header">
              <h3 className="section-title">Recent submissions</h3>
              <button type="button" className="view-all-btn" onClick={() => navigate("/my-submissions")}>
                View all
              </button>
            </div>

            <div className="assignments-table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                        No submissions yet.
                      </td>
                    </tr>
                  ) : (
                    recentSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>
                          <div className="assignment-title-cell">
                            <div className="submission-icon">
                              <i className="fas fa-check-double" />
                            </div>
                            <span>{submission.title}</span>
                          </div>
                        </td>
                        <td>
                          <span className="score-text">{submission.score}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${(submission.status || "").toLowerCase()}`}>{submission.status}</span>
                        </td>
                        <td>{submission.submittedAt}</td>
                        <td>
                          <button
                            type="button"
                            className="action-btn view"
                            onClick={() => navigate(`/student/submission/${submission.id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* join modal removed from dashboard; use Classes page to join */}
    </div>
  );
}

export default StudentDashboardPage;
