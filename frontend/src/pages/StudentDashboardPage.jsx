import { useMemo, useState } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import StudentStats from "../components/dashboard/StudentStats.jsx";
import PerformanceCard from "../components/dashboard/PerformanceCard.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import "../styles/teacherDashboard.css";
import "../styles/studentDashboard.css";

function StudentDashboardPage() {
  // Mock data for student stats
  const [stats, setStats] = useState({
    totalAssignments: 12,
    completedAssignments: 8,
    pendingAssignments: 4,
    averageScore: "85%",
  });

  // Mock data for upcoming assignments
  const [upcomingAssignments] = useState([
    { id: 1, title: "Advanced Data Structures", deadline: "Oct 28, 2026", status: "Pending", action: "Start" },
    { id: 2, title: "Operating Systems Project", deadline: "Nov 02, 2026", status: "Pending", action: "Start" },
    { id: 3, title: "Database Normalization", deadline: "Nov 05, 2026", status: "Submitted", action: "View" },
    { id: 4, title: "Web Security Lab", deadline: "Nov 10, 2026", status: "Late", action: "Continue" },
    { id: 5, title: "Machine Learning Quiz", deadline: "Nov 12, 2026", status: "Pending", action: "Start" },
  ]);

  // Mock data for recent submissions
  const [recentSubmissions] = useState([
    { id: 1, title: "Database Quiz", score: "95/100", status: "Passed", submittedAt: "Oct 20, 2026" },
    { id: 2, title: "HTML/CSS Layouts", score: "88/100", status: "Passed", submittedAt: "Oct 18, 2026" },
    { id: 3, title: "JavaScript Logic Lab", score: "45/100", status: "Failed", submittedAt: "Oct 15, 2026" },
    { id: 4, title: "UI/UX Design Principles", score: "92/100", status: "Passed", submittedAt: "Oct 12, 2026" },
  ]);

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }, []);

  const studentMenuItems = [
    { path: "/student-dashboard", icon: "fas fa-th-large", label: "Dashboard" },
    { path: "/student-assignments", icon: "fas fa-book-open", label: "Assignments" },
    { path: "/my-submissions", icon: "fas fa-upload", label: "My Submissions" },
    { path: "/performance", icon: "fas fa-chart-line", label: "Performance" },
  ];

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={studentMenuItems} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">
          <StudentStats stats={stats} />

          <div className="dashboard-grid-content">
            <PerformanceCard />
            <ProfileCard user={user} />
          </div>

          {/* Upcoming Assignments Section - Moved to Bottom */}
          <section className="upcoming-assignments-section">
            <div className="section-header">
              <h3 className="section-title">Upcoming Assignments</h3>
              <button className="view-all-btn">View All</button>
            </div>

            <div className="assignments-table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment Title</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <div className="assignment-title-cell">
                          <div className="assignment-icon"><i className="fas fa-file-alt"></i></div>
                          <span>{assignment.title}</span>
                        </div>
                      </td>
                      <td>{assignment.deadline}</td>
                      <td>
                        <span className={`status-badge ${assignment.status.toLowerCase()}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td>
                        <button className={`action-btn ${assignment.action.toLowerCase()}`}>
                          {assignment.action === "Start" ? "Start" : assignment.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Submissions Section */}
          <section className="recent-submissions-section">
            <div className="section-header">
              <h3 className="section-title">Recent Submissions</h3>
              <button className="view-all-btn">View All</button>
            </div>

            <div className="assignments-table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment Name</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        <div className="assignment-title-cell">
                          <div className="submission-icon"><i className="fas fa-check-double"></i></div>
                          <span>{submission.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="score-text">{submission.score}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${submission.status.toLowerCase()}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td>{submission.submittedAt}</td>
                      <td>
                        <button className="action-btn view">View Report</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboardPage;
