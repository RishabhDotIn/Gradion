import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

function LandingNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      if (user?.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (user?.role === 'student') {
        navigate('/student-dashboard');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <i className="fas fa-graduation-cap" />
          </div>
          <span className="logo-text">Gradion</span>
        </div>
        <div className="nav-right">
          {isAuthenticated && user ? (
            <div className="nav-user-profile">
              <div className="nav-user-info">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.fullName || "User")}&background=3B82F6&color=fff`} 
                  alt="Profile" 
                  className="nav-avatar"
                />
                <span className="nav-user-name">{user?.name || user?.fullName || (user?.email ? user.email.split("@")[0] : "User")}</span>
                <span className="nav-user-role">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default LandingNavbar;
