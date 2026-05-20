import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import TeacherDashboardPage from "./pages/TeacherDashboardPage.jsx";
import StudentDashboardPage from "./pages/StudentDashboardPage.jsx";
import StudentClassesPage from "./pages/StudentClassesPage.jsx";
import StudentAssignmentsPage from "./pages/StudentAssignmentsPage.jsx";
import AssignmentLandingPage from "./pages/AssignmentLandingPage.jsx";
import CreateAssignmentPage from "./pages/CreateAssignmentPage.jsx";
import TeacherAssignmentsPage from "./pages/TeacherAssignmentsPage.jsx";
import AssignmentEditorPage from "./pages/AssignmentEditorPage.jsx";
import TeacherViewAssignmentPage from "./pages/TeacherViewAssignmentPage.jsx";
import StudentSubmissionsPage from "./pages/StudentSubmissionsPage.jsx";
import StudentViewSubmissionPage from "./pages/StudentViewSubmissionPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

import TeacherSubmissionsPage from "./pages/TeacherSubmissionsPage.jsx";
import TeacherStudentsPage from "./pages/TeacherStudentsPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute role="teacher">
            <TeacherDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-assignment"
        element={
          <ProtectedRoute role="teacher">
            <CreateAssignmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-assignments"
        element={
          <ProtectedRoute role="teacher">
            <TeacherAssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/submissions"
        element={
          <ProtectedRoute role="teacher">
            <TeacherSubmissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute role="teacher">
            <TeacherStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/assignment/view/:id"
        element={
          <ProtectedRoute role="teacher">
            <TeacherViewAssignmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-classes"
        element={
          <ProtectedRoute role="student">
            <StudentClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-assignments"
        element={
          <ProtectedRoute role="student">
            <StudentAssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-submissions"
        element={
          <ProtectedRoute role="student">
            <StudentSubmissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/submission/:id"
        element={
          <ProtectedRoute role="student">
            <StudentViewSubmissionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignment/:id"
        element={
          <ProtectedRoute role="student">
            <AssignmentLandingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignment/:id/editor/:qIdx"
        element={
          <ProtectedRoute role="student">
            <AssignmentEditorPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
