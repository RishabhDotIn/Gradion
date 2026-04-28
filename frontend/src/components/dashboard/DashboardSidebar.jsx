import { Link, useLocation } from "react-router-dom";

function DashboardSidebar({ menuItems }) {
  const location = useLocation();

  const defaultItems = [
    { path: "/teacher-dashboard", icon: "fas fa-th-large", label: "Dashboard" },
    { path: "/create-assignment", icon: "fas fa-plus-circle", label: "Create Assignment" },
    { path: "/teacher-assignments", icon: "fas fa-book-open", label: "Assignments" },
    { path: "/submissions", icon: "fas fa-file-alt", label: "Submissions" },
    { path: "/students", icon: "fas fa-users", label: "Students" },
    { path: "/reports", icon: "fas fa-chart-bar", label: "Reports" },
  ];

  const items = menuItems || defaultItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <div className="logo-icon"><i className="fas fa-graduation-cap" /></div>
          <span className="logo-text">Gradion</span>
        </Link>
      </div>
      <nav className="sidebar-nav">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
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
