import { Link } from "react-router-dom";

function LandingNavbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <div className="logo-icon">
            <i className="fas fa-graduation-cap" />
          </div>
          <span className="logo-text">Gradion</span>
        </div>
        <div className="nav-right">
          <Link to="/login" className="btn-login">
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default LandingNavbar;
