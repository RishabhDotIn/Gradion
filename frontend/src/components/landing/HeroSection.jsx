import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

function HeroSection() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="hero-content">
        <div className="hero-badge">
          <i className="fas fa-graduation-cap" />
          <span>GRADION - Automated Academic Evaluation Suite</span>
        </div>
        <h1 className="hero-title">
          Create, submit and manage
          <br />
          <span className="gradient-text">programming assignments</span> efficiently.
        </h1>
        <p className="hero-subtitle">
          Streamline your academic workflow with our intelligent evaluation platform.
          Automated grading, real-time feedback, and comprehensive analytics for
          educators and students.
        </p>
        <div className="hero-buttons">
          {isAuthenticated ? (
            <button 
              className="btn-primary btn-dashboard" 
              onClick={() => navigate(user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')}
            >
              <i className="fas fa-tachometer-alt" />
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/register" className="btn-primary">
                <i className="fas fa-rocket" />
                Get Started
              </Link>
              <button className="btn-secondary" type="button">
                <i className="fas fa-play-circle" />
                Watch Demo
              </button>
            </>
          )}
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-users" />
            </div>
            <div className="stat-info">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Users</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-file-code" />
            </div>
            <div className="stat-info">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Assignments</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-check-circle" />
            </div>
            <div className="stat-info">
              <span className="stat-number">99%</span>
              <span className="stat-label">Accuracy</span>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-glow" />
    </section>
  );
}

export default HeroSection;
