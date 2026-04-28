import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardStats from "../components/dashboard/DashboardStats.jsx";
import DashboardTables from "../components/dashboard/DashboardTables.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import TeacherPerformanceCard from "../components/dashboard/TeacherPerformanceCard.jsx";
import "../styles/teacherDashboard.css";
import "../styles/studentDashboard.css";

const API_BASE_URL = "/api";

function TeacherDashboardPage() {
  const mockAssignments = [
    { id: 1, title: "Advanced Data Structures", deadline: "2026-10-28", submissions: 42 },
    { id: 2, title: "Operating Systems Project", deadline: "2026-11-02", submissions: 38 },
    { id: 3, title: "Database Normalization", deadline: "2026-11-05", submissions: 45 },
    { id: 4, title: "Web Security Lab", deadline: "2026-11-10", submissions: 40 },
    { id: 5, title: "Machine Learning Quiz", deadline: "2026-11-12", submissions: 35 },
  ];

  const mockSubmissions = [
    { id: 1, studentName: "Alice Johnson", assignmentTitle: "Advanced Data Structures", submittedAt: new Date() },
    { id: 2, studentName: "Bob Smith", assignmentTitle: "Operating Systems Project", submittedAt: new Date() },
    { id: 3, studentName: "Charlie Brown", assignmentTitle: "Database Normalization", submittedAt: new Date() },
    { id: 4, studentName: "Diana Prince", assignmentTitle: "Web Security Lab", submittedAt: new Date() },
    { id: 5, studentName: "Evan Wright", assignmentTitle: "Machine Learning Quiz", submittedAt: new Date() },
  ];

  const [stats, setStats] = useState({ totalAssignments: 0, totalStudents: 0, totalSubmissions: 0, pendingReviews: "0.00%" });
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }, []);

  useEffect(() => {
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
    const load = async () => {
      try {
        const [statsRes, assignmentsRes, submissionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/stats`, { method: "GET", headers }),
          fetch(`${API_BASE_URL}/assignments/recent?limit=5`, { method: "GET", headers }),
          fetch(`${API_BASE_URL}/submissions/recent?limit=5`, { method: "GET", headers }),
        ]);
        const statsData = statsRes.ok ? await statsRes.json() : {};
        const assignmentsData = assignmentsRes.ok ? await assignmentsRes.json() : [];
        const submissionsData = submissionsRes.ok ? await submissionsRes.json() : [];
        setStats({
          totalAssignments: statsData.totalAssignments || 0,
          totalStudents: statsData.totalStudents || 0,
          totalSubmissions: statsData.totalSubmissions || 0,
          pendingReviews: typeof statsData.pendingReviews === "number" ? `${statsData.pendingReviews.toFixed(2)}%` : (statsData.pendingReviews || "0.00%"),
        });
        let finalAssignments = assignmentsData.assignments || assignmentsData || [];
        if (!Array.isArray(finalAssignments) || finalAssignments.length === 0) {
          finalAssignments = mockAssignments;
        }
        
        let finalSubmissions = submissionsData.submissions || submissionsData || [];
        if (!Array.isArray(finalSubmissions) || finalSubmissions.length === 0) {
          finalSubmissions = mockSubmissions;
        }

        setAssignments(finalAssignments.slice(0, 5));
        setSubmissions(finalSubmissions.slice(0, 5));
      } catch {
        setAssignments(mockAssignments);
        setSubmissions(mockSubmissions);
      }
    };
    load();
  }, []);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">

          <DashboardStats stats={stats} />

          <div className="dashboard-grid-content">
            <TeacherPerformanceCard />
            <ProfileCard user={user} compact={true} />
          </div>

          <DashboardTables assignments={assignments} submissions={submissions} />
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboardPage;
