import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_CONFIG, apiCall } from "../lib/apiConfig.js";
import LandingNavbar from "../components/landing/LandingNavbar.jsx";
import "../styles/register.css";

function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const submitBtnRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.REGISTER, "POST", {
        fullName,
        email,
        password,
        role,
      });
      if (!data.success) throw new Error(data.message || "Registration was not successful");
      if (data.token) localStorage.setItem("token", data.token);
      if (submitBtnRef.current) submitBtnRef.current.style.background = "#22c55e";
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setErrorMessage(error.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <LandingNavbar />
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="register-container">
        <div className="register-card">
          <p className="register-subtitle">Create your professional academic profile</p>
          <form className="register-form" id="registerForm" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">FULL NAME</label>
              <div className="input-wrapper"><i className="fas fa-user" /><input type="text" name="name" placeholder="Dr. Julian Smith" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">INSTITUTIONAL EMAIL</label>
              <div className="input-wrapper"><i className="fas fa-envelope" /><input type="email" name="email" placeholder="jsmith@university.edu" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">SECURITY PASSWORD</label>
              <div className="input-wrapper">
                <i className="fas fa-lock" />
                <input type={passwordVisible ? "text" : "password"} name="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                <button type="button" className="toggle-password" onClick={() => setPasswordVisible((v) => !v)}><i className={`fas ${passwordVisible ? "fa-eye-slash" : "fa-eye"}`} /></button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">SELECT YOUR ROLE</label>
              <div className="role-selector">
                <div className={`role-option ${role === "student" ? "selected" : ""}`} data-role="student" onClick={() => setRole("student")}>
                  <div className="role-icon"><i className="fas fa-book-reader" /></div><span className="role-name">student</span><div className="role-check"><i className="fas fa-check" /></div>
                </div>
                <div className={`role-option ${role === "teacher" ? "selected" : ""}`} data-role="teacher" onClick={() => setRole("teacher")}>
                  <div className="role-icon"><i className="fas fa-chalkboard-teacher" /></div><span className="role-name">teacher</span><div className="role-check"><i className="fas fa-check" /></div>
                </div>
              </div>
            </div>
            {errorMessage ? <div className="error-message"><i className="fas fa-exclamation-circle" /> {errorMessage}</div> : null}
            <button ref={submitBtnRef} type="submit" className="btn-submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin" /> Creating account...</> : <>Join Gradion <i className="fas fa-chevron-right" /></>}
            </button>
          </form>
          <div className="login-link">Already have an account? <Link to="/login">Login here</Link></div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
