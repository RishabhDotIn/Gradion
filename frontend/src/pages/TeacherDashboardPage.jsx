import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardStats from "../components/dashboard/DashboardStats.jsx";
import DashboardTables from "../components/dashboard/DashboardTables.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import TeacherPerformanceCard from "../components/dashboard/TeacherPerformanceCard.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import "../styles/teacherDashboard.css";
import "../styles/studentDashboard.css";

const MOCK_ASSIGNMENTS = [
  { id: 1, title: "Advanced Data Structures", deadline: "2026-10-28", submissions: 42 },
  { id: 2, title: "Operating Systems Project", deadline: "2026-11-02", submissions: 38 },
  { id: 3, title: "Database Normalization", deadline: "2026-11-05", submissions: 45 },
  { id: 4, title: "Web Security Lab", deadline: "2026-11-10", submissions: 40 },
  { id: 5, title: "Machine Learning Quiz", deadline: "2026-11-12", submissions: 35 },
];

const MOCK_SUBMISSIONS = [
  { id: 1, studentName: "Alice Johnson", assignmentTitle: "Advanced Data Structures", submittedAt: new Date() },
  { id: 2, studentName: "Bob Smith", assignmentTitle: "Operating Systems Project", submittedAt: new Date() },
  { id: 3, studentName: "Charlie Brown", assignmentTitle: "Database Normalization", submittedAt: new Date() },
  { id: 4, studentName: "Diana Prince", assignmentTitle: "Web Security Lab", submittedAt: new Date() },
  { id: 5, studentName: "Evan Wright", assignmentTitle: "Machine Learning Quiz", submittedAt: new Date() },
];

function TeacherDashboardPage() {
  const [stats, setStats] = useState({ totalAssignments: 0, totalStudents: 0, totalSubmissions: 0, pendingReviews: "0.00%" });
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceImprovement, setPerformanceImprovement] = useState(0);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsResult, assignmentsResult, performanceResult] = await Promise.allSettled([
          apiCall("/api/dashboard/stats"),
          apiCall(`${API_CONFIG.ENDPOINTS.TEACHER_RECENT}?limit=5`),
          apiCall(`${API_CONFIG.ENDPOINTS.TEACHER_PERFORMANCE}`),
        ]);
        const statsData = statsResult.status === "fulfilled" ? statsResult.value : {};
        const assignmentsData = assignmentsResult.status === "fulfilled" ? assignmentsResult.value : [];
        const performanceData = performanceResult.status === "fulfilled" ? performanceResult.value : {};
        const submissionsData = MOCK_SUBMISSIONS;
        setStats({
          totalAssignments: statsData.totalAssignments || 0,
          totalStudents: statsData.totalStudents || 0,
          totalSubmissions: statsData.totalSubmissions || 0,
          pendingReviews: typeof statsData.pendingReviews === "number" ? `${statsData.pendingReviews.toFixed(2)}%` : (statsData.pendingReviews || "0.00%"),
        });
        let finalAssignments = assignmentsData.assignments || assignmentsData || [];
        if (!Array.isArray(finalAssignments) || finalAssignments.length === 0) {
          finalAssignments = MOCK_ASSIGNMENTS;
        }
        
        let finalSubmissions = submissionsData.submissions || submissionsData || [];
        if (!Array.isArray(finalSubmissions) || finalSubmissions.length === 0) {
          finalSubmissions = MOCK_SUBMISSIONS;
        }

        setAssignments(finalAssignments.slice(0, 5));
        setSubmissions(finalSubmissions.slice(0, 5));
        setPerformanceData(Array.isArray(performanceData.chart) ? performanceData.chart : []);
        setPerformanceImprovement(typeof performanceData.improvement === "number" ? performanceData.improvement : 0);
        setPerformanceLoading(false);
      } catch {
        setAssignments(MOCK_ASSIGNMENTS);
        setSubmissions(MOCK_SUBMISSIONS);
        setPerformanceData([]);
        setPerformanceImprovement(0);
        setPerformanceLoading(false);
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
            <TeacherPerformanceCard
              data={performanceData}
              improvement={performanceImprovement}
              loading={performanceLoading}
            />
            <ProfileCard user={user} compact={true} />
          </div>

          <DashboardTables assignments={assignments} submissions={submissions} />
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboardPage;
