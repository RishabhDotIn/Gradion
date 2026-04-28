function LandingFooter() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col footer-brand"><div className="footer-logo"><div className="logo-icon"><i className="fas fa-graduation-cap" /></div><span className="logo-text">Gradion</span></div><p className="footer-desc">Empowering modern workflows with intelligent automation and seamless integration.</p></div>
        <div className="footer-col footer-links"><ul><li><a href="#">Docs</a></li><li><a href="#">Assignment Repo</a></li><li><a href="#">Privacy</a></li></ul><ul><li><a href="#">Features</a></li><li><a href="#">Contact</a></li><li><a href="#">Terms</a></li></ul></div>
        <div className="footer-col footer-news"><div className="footer-news-title">STAY UPDATED</div><form className="footer-news-form"><input type="email" placeholder="Enter your email" required /><button type="submit"><i className="fas fa-paper-plane" /></button></form><div className="footer-news-title" style={{ marginTop: "24px" }}>CONNECT</div><div className="footer-socials"><a href="#" aria-label="GitHub"><i className="fab fa-github" /></a><a href="#" aria-label="Twitter"><i className="fab fa-twitter" /></a><a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a></div></div>
      </div>
      <div className="footer-bottom"><span>&copy; 2026 Gradion Inc. All rights reserved.</span><span className="footer-version">v1.2.4-stable</span></div>
    </footer>
  );
}

export default LandingFooter;
