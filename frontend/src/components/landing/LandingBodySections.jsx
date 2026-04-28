import { Link } from "react-router-dom";

function LandingBodySections() {
  return (
    <>
      <section className="features">
        <div className="features-container">
          <div className="features-header">
            <div className="features-header-left">
              <span className="section-badge">PLATFORM CAPABILITIES</span>
              <h2 className="section-title">
                Powerful features for modern
                <br />
                <span className="gradient-text">technical education</span>.
              </h2>
              <p className="section-subtitle">
                Gradion provides the infrastructure you need to scale coding
                assessments, ensure code quality, and maintain security at every level.
              </p>
            </div>
            <div className="features-header-right">
              <Link to="/register" className="btn-primary">
                Get Started
                <i className="fas fa-arrow-right" />
              </Link>
            </div>
          </div>
          <div className="features-grid">
            <div className="feature-card"><div className="feature-icon"><i className="fas fa-code" /></div><h3 className="feature-title">Automated Evaluation</h3><p className="feature-description">Instant grading and feedback on code submissions using customizable test suites and unit tests.</p></div>
            <div className="feature-card"><div className="feature-icon"><i className="fas fa-search" /></div><div className="feature-title-row"><h3 className="feature-title">Plagiarism Detection</h3><span className="feature-badge">PLACEHOLDER</span></div><p className="feature-description">Advanced similarity checks across internal submissions and public repositories to ensure academic integrity.</p></div>
            <div className="feature-card"><div className="feature-icon"><i className="fas fa-shield-alt" /></div><div className="feature-title-row"><h3 className="feature-title">AI Analysis</h3><span className="feature-badge">PLACEHOLDER</span></div><p className="feature-description">Intelligent code review providing insights into complexity, readability, and adherence to best practices.</p></div>
            <div className="feature-card"><div className="feature-icon"><i className="fas fa-lock" /></div><h3 className="feature-title">Secure Code Execution</h3><p className="feature-description">Sandboxed environments for running untrusted code safely without compromising infrastructure security.</p></div>
            <div className="feature-card"><div className="feature-icon"><i className="fas fa-chart-bar" /></div><h3 className="feature-title">Detailed Reports</h3><p className="feature-description">Comprehensive analytics on student performance, common errors, and longitudinal growth metrics.</p></div>
            <div className="feature-card"><div className="feature-icon"><i className="fas fa-users-cog" /></div><h3 className="feature-title">Role-Based Access</h3><p className="feature-description">Granular permission controls for students, teaching assistants, and administrators across the platform.</p></div>
          </div>
        </div>
      </section>

      <section className="developer-section">
        <div className="developer-container">
          <div className="developer-left">
            <h2 className="developer-title">Designed for the Next Generation of <span className="gradient-text">Developers</span></h2>
            <div className="developer-features">
              <div className="developer-feature"><div className="developer-feature-icon"><i className="fas fa-bolt" /></div><div className="developer-feature-content"><h4 className="developer-feature-title">Automated Grading</h4><p className="developer-feature-desc">Get instant feedback on your code syntax, logic, and efficiency scores.</p></div></div>
              <div className="developer-feature"><div className="developer-feature-icon"><i className="fas fa-comments" /></div><div className="developer-feature-content"><h4 className="developer-feature-title">Collaborative Learning</h4><p className="developer-feature-desc">Teachers can provide inline comments and direct assistance on student submissions.</p></div></div>
              <div className="developer-feature"><div className="developer-feature-icon"><i className="fas fa-tasks" /></div><div className="developer-feature-content"><h4 className="developer-feature-title">Assignment Management</h4><p className="developer-feature-desc">Create, organize, and manage programming assignments with deadlines.</p></div></div>
              <div className="developer-feature"><div className="developer-feature-icon"><i className="fas fa-shield-alt" /></div><div className="developer-feature-content"><h4 className="developer-feature-title">Secure Code Submissions</h4><p className="developer-feature-desc">Students can submit code securely before deadlines with full submission history.</p></div></div>
            </div>
          </div>
          <div className="developer-right">
            <div className="code-preview">
              <div className="code-header"><div className="code-dots"><span className="dot red" /><span className="dot yellow" /><span className="dot green" /></div><span className="code-filename">gradion-workspace.js</span></div>
              <div className="code-body">
                <pre><code><span className="line-number">1</span>  <span className="keyword">import</span> {"{ "} <span className="variable">Grade</span> {"} "} <span className="keyword">from</span> <span className="string">"@gradion/core"</span>;{"\n"}
<span className="line-number">2</span>{"\n"}
<span className="line-number">3</span>  <span className="keyword">const</span> <span className="variable">submission</span> = <span className="keyword">await</span> Gradion.getSubmission(id);{"\n"}
<span className="line-number">4</span>{"\n"}
<span className="line-number">5</span>  <span className="comment">// Run automated test suite</span>{"\n"}
<span className="line-number">6</span>  <span className="keyword">const</span> <span className="variable">results</span> = <span className="keyword">await</span> submission.test();{"\n"}
<span className="line-number">7</span>  console.log(<span className="string">"Final Score"</span>, results.score);{"\n"}
<span className="line-number">8</span>{"\n"}
<span className="line-number">9</span>  <span className="success">✓ All 12 test cases passed successfully.</span>{"\n"}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="how-container">
          <div className="how-header"><h2 className="how-title">How It Works</h2><p className="how-subtitle">Follow these four simple steps to begin your journey in our specialized programming ecosystem.</p></div>
          <div className="how-steps">
            <div className="how-step"><div className="step-header"><div className="step-icon"><i className="fas fa-user-plus" /></div><span className="step-number">01</span></div><h3 className="step-title">Register Your Account</h3><p className="step-desc">Join as a Student to learn or a Teacher to manage classrooms and grade code efficiently.</p></div>
            <div className="how-step"><div className="step-header"><div className="step-icon"><i className="fas fa-sign-in-alt" /></div><span className="step-number">02</span></div><h3 className="step-title">Login to the System</h3><p className="step-desc">Access your personalized dashboard with secure SSO or traditional credentials in seconds.</p></div>
            <div className="how-step"><div className="step-header"><div className="step-icon"><i className="fas fa-code" /></div><span className="step-number">03</span></div><h3 className="step-title">View Assignments</h3><p className="step-desc">Browse through active coding challenges, projects, and labs tailored to your curriculum level.</p></div>
            <div className="how-step"><div className="step-header"><div className="step-icon"><i className="fas fa-paper-plane" /></div><span className="step-number">04</span></div><h3 className="step-title">Submit Solutions</h3><p className="step-desc">Upload your code directly or sync with Git. Get instant automated feedback and grading.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingBodySections;
