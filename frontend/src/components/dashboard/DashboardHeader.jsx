import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function DashboardHeader({ user }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="dashboard-header">
      <div className="header-left"><h1 className="header-title">Dashboard</h1></div>
      <div className="header-right">
        <div className="header-search"><i className="fas fa-search" /><input type="text" placeholder="Search anything" /></div>
        <button className="header-icon-btn" type="button"><i className="fas fa-envelope" /></button>
        <button className="header-icon-btn" type="button"><i className="fas fa-bell" /></button>
        <div className="header-user" onClick={() => setShowDropdown(!showDropdown)} ref={dropdownRef}>
          <div className="header-avatar">
            <img id="userAvatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.fullName || "User")}&background=3B82F6&color=fff`} alt="Profile" />
          </div>
          <div className="header-user-info">
            <span className="header-user-name" id="userName">{user?.name || user?.fullName || (user?.email ? user.email.split("@")[0] : "Loading...")}</span>
            <span className="header-user-role" id="userRole">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
            </span>
          </div>
          <i className={`fas fa-chevron-down dropdown-arrow ${showDropdown ? "open" : ""}`} />
          
          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-item">
                <i className="fas fa-user-circle" />
                <span>My Profile</span>
              </div>
              <div className="dropdown-item">
                <i className="fas fa-cog" />
                <span>Settings</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
