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

function TeacherDashboardPage() {
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
  });
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
        const [dash, assignmentsResult, subsResult, performanceResult] = await Promise.allSettled([
          apiCall(API_CONFIG.ENDPOINTS.DASHBOARD_TEACHER),
          apiCall(`${API_CONFIG.ENDPOINTS.TEACHER_RECENT}?limit=5`),
          apiCall(`${API_CONFIG.ENDPOINTS.SUBMISSIONS}/teacher?limit=5&page=1`),
          apiCall(`${API_CONFIG.ENDPOINTS.TEACHER_PERFORMANCE}`),
        ]);

        const dashData = dash.status === "fulfilled" ? dash.value : {};
        setStats({
          totalAssignments: dashData.totalAssignments ?? 0,
          totalStudents: dashData.totalStudents ?? 0,
          totalSubmissions: dashData.totalSubmissions ?? 0,
          pendingReviews: dashData.pendingReviews ?? 0,
          previousWeek: dashData.previousWeek || null,
        });

        const assignmentsData = assignmentsResult.status === "fulfilled" ? assignmentsResult.value : {};
        let finalAssignments = assignmentsData.assignments || assignmentsData || [];
        if (!Array.isArray(finalAssignments) || finalAssignments.length === 0) {
          finalAssignments = MOCK_ASSIGNMENTS;
        }

        const submissionsData = subsResult.status === "fulfilled" ? subsResult.value : {};
        let finalSubmissions = (submissionsData.submissions || []).map((s) => ({
          id: s._id,
          studentName: s.student?.fullName || "Student",
          assignmentTitle: s.assignment?.title || "Assignment",
          submittedAt: s.submittedAt || s.createdAt,
        }));
        if (!finalSubmissions.length) {
          finalSubmissions = [];
        }

        const performanceData = performanceResult.status === "fulfilled" ? performanceResult.value : {};

        setAssignments(finalAssignments.slice(0, 5));
        setSubmissions(finalSubmissions.slice(0, 5));
        setPerformanceData(Array.isArray(performanceData.chart) ? performanceData.chart : []);
        setPerformanceImprovement(typeof performanceData.improvement === "number" ? performanceData.improvement : 0);
        setPerformanceLoading(false);
      } catch {
        setAssignments(MOCK_ASSIGNMENTS);
        setSubmissions([]);
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
              dashboardTotals={{
                totalStudents: stats.totalStudents,
                totalSubmissions: stats.totalSubmissions,
                totalAssignments: stats.totalAssignments,
              }}
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
