import { Navigate, useLocation } from "react-router-dom";
import { getSessionRole, isAuthenticated } from "../lib/authSession.js";

/**
 * Wraps routes that require login and an optional role ('teacher' | 'student').
 * Uses stored user + JWT payload so the UI cannot show the wrong sidebar after login.
 */
function ProtectedRoute({ children, role }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const actual = getSessionRole();
  if (role && actual && actual !== role) {
    if (role === "teacher") {
      return <Navigate to="/student-dashboard" replace />;
    }
    return <Navigate to="/teacher-dashboard" replace />;
  }

  if (role && !actual) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
