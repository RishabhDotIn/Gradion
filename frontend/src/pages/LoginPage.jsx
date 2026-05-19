import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_CONFIG, apiCall } from "../lib/apiConfig.js";
import LandingNavbar from "../components/landing/LandingNavbar.jsx";
import "../styles/login.css";

function LoginPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.LOGIN, "POST", {
        email,
        password,
        rememberMe,
      });
      if (!data.success) throw new Error(data.message || "Login was not successful");
      if (data.token) {
        // Use sessionStorage instead of localStorage for better security
        sessionStorage.setItem("token", data.token);
      }
      if (data.user) {
        // Sanitize user data before storing
        const sanitizedUser = {
          id: data.user.id,
          fullName: data.user.fullName,
          email: data.user.email,
          role: data.user.role
        };
        sessionStorage.setItem("user", JSON.stringify(sanitizedUser));
      } else {
        sessionStorage.setItem("user", JSON.stringify({ email }));
      }
      setTimeout(() => {
        if (data.user && data.user.role === "teacher") {
          navigate("/teacher-dashboard");
        } else if (data.user && data.user.role === "student") {
          navigate("/student-dashboard");
        } else {
          navigate("/");
        }
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <LandingNavbar />
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Sign in to your account</h2>
            <p className="login-subtitle">Enter your academic credentials to continue</p>
          </div>
          <form className="login-form" id="loginForm" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@university.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="form-group">
              <div className="form-label-row"><label className="form-label">Password</label><a href="#" className="forgot-link">Forgot password?</a></div>
              <div className="input-wrapper password-wrapper">
                <i className="fas fa-lock" />
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <span className="toggle-password" id="togglePassword" onClick={() => setPasswordVisible((v) => !v)}>
                  <i className={`fas ${passwordVisible ? "fa-eye-slash" : "fa-eye"}`} id="eyeIcon" />
                </span>
              </div>
            </div>
            <div className="remember-me">
              <label className="checkbox-wrapper">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="checkbox-label">Remember me for 7 days</span>
              </label>
            </div>
            {errorMessage ? <div className="error-message"><i className="fas fa-exclamation-circle" /> {errorMessage}</div> : null}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin" /> Logging in...</> : <>Login <i className="fas fa-arrow-right" /></>}
            </button>
            <div className="register-section">
              <span className="register-text">NEW TO GRADION?</span>
              <Link to="/register" className="btn-register">Create an Educator or Student Account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
