import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { getSessionRole } from "../../lib/authSession.js";
import { STUDENT_MENU_ITEMS } from "../../nav/studentMenu.js";

const teacherDefaultItems = [
  { path: "/teacher-dashboard", icon: "fas fa-th-large", label: "Dashboard" },
  { path: "/create-assignment", icon: "fas fa-plus-circle", label: "Create Assignment" },
  { path: "/teacher-assignments", icon: "fas fa-book-open", label: "Assignments" },
  { path: "/submissions", icon: "fas fa-file-alt", label: "Submissions" },
  { path: "/students", icon: "fas fa-users", label: "Manage Classes" },
  { path: "/reports", icon: "fas fa-chart-bar", label: "Reports" },
];

const studentDefaultItems = STUDENT_MENU_ITEMS;

function DashboardSidebar({ menuItems }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || getSessionRole();

  /** Only explicit teacher sees teacher nav; missing role must not default to teacher (student UX bug). */
  const fallback = role === "teacher" ? teacherDefaultItems : studentDefaultItems;
  const items = menuItems || fallback;

  const linkActive = (path) => {
    if (location.pathname === path) return true;
    if (path === "/student-dashboard" || path === "/teacher-dashboard") return false;
    return location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link
          to={
            (user?.role || getSessionRole()) === "teacher"
              ? "/teacher-dashboard"
              : "/student-dashboard"
          }
          className="sidebar-logo"
        >
          <div className="logo-icon"><i className="fas fa-graduation-cap" /></div>
          <span className="logo-text">Gradion</span>
        </Link>
      </div>
      <nav className="sidebar-nav">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`sidebar-link ${linkActive(item.path) ? "active" : ""}`}
          >
            <i className={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Link to="/help" className="sidebar-link">
          <i className="fas fa-question-circle" />
          <span>Help & Support</span>
        </Link>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
