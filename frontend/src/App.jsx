import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import TeacherDashboardPage from "./pages/TeacherDashboardPage.jsx";
import StudentDashboardPage from "./pages/StudentDashboardPage.jsx";
import StudentAssignmentsPage from "./pages/StudentAssignmentsPage.jsx";
import AssignmentLandingPage from "./pages/AssignmentLandingPage.jsx";
import CreateAssignmentPage from "./pages/CreateAssignmentPage.jsx";
import TeacherAssignmentsPage from "./pages/TeacherAssignmentsPage.jsx";
import AssignmentEditorPage from "./pages/AssignmentEditorPage.jsx";
import TeacherViewAssignmentPage from "./pages/TeacherViewAssignmentPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboardPage />} />
      <Route path="/student-dashboard" element={<StudentDashboardPage />} />
      <Route path="/student-assignments" element={<StudentAssignmentsPage />} />
      <Route path="/create-assignment" element={<CreateAssignmentPage />} />
      <Route path="/teacher-assignments" element={<TeacherAssignmentsPage />} />
      <Route path="/teacher/assignment/view/:id" element={<TeacherViewAssignmentPage />} />
      <Route path="/assignment/:id" element={<AssignmentLandingPage />} />
      <Route path="/assignment/:id/editor/:qIdx" element={<AssignmentEditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
