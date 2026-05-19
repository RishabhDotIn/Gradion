import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import { STUDENT_MENU_ITEMS } from "../nav/studentMenu.js";
import "../styles/teacherDashboard.css";
import "../styles/studentDashboard.css";
import "../styles/teacherStudents.css";

export default function StudentClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const user = useMemo(() => {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.CLASSES_STUDENT);
      setClasses(data.classes || []);
    } catch (e) {
      toast.error(e.message || "Could not load classes");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Enter an invite code.");
      return;
    }
    setJoining(true);
    try {
      await apiCall(API_CONFIG.ENDPOINTS.CLASSES_JOIN, "POST", { inviteCode: inviteCode.trim() });
      toast.success("Joined class successfully.");
      setInviteCode("");
      setShowJoinModal(false);
      await load();
    } catch (err) {
      toast.error(err.message || "Could not join class");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={STUDENT_MENU_ITEMS} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">
          <div className="student-dashboard-toolbar">
            <div className="student-dashboard-toolbar-copy">
              <span className="student-dashboard-toolbar-title">My classes</span>
              <span className="student-dashboard-toolbar-hint">
                Courses you are enrolled in. Join new ones with an invite code from your instructor.
              </span>
            </div>
            <button type="button" className="btn-join-class" onClick={() => setShowJoinModal(true)}>
              <span className="btn-join-class-icon" aria-hidden>
                <i className="fas fa-door-open" />
              </span>
              <span className="btn-join-class-text">Join a class</span>
            </button>
          </div>

          <section className="upcoming-assignments-section" id="enrolled-classes">
            <div className="section-header">
              <h3 className="section-title">Enrolled classes</h3>
            </div>
            {loading ? (
              <p style={{ padding: "24px", color: "#64748b" }}>
                <i className="fas fa-spinner fa-spin" /> Loading…
              </p>
            ) : classes.length === 0 ? (
              <p style={{ padding: "24px", color: "#64748b" }}>
                You are not in any class yet. Use &quot;Join a class&quot; with your invite code.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "16px",
                  paddingBottom: "8px",
                }}
              >
                {classes.map((c) => (
                  <div
                    key={c._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "20px",
                      background: "#fff",
                      boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "8px" }}>{c.name}</div>
                    {c.teacher && (
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        <i className="fas fa-user-tie" style={{ marginRight: "6px" }} />
                        {c.teacher.fullName || "Instructor"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {showJoinModal && (
        <div className="modal-overlay" style={{ zIndex: 50 }} onClick={() => setShowJoinModal(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3>Join a class</h3>
              <p>Enter the invite code from your instructor.</p>
              <button type="button" className="close-modal" onClick={() => setShowJoinModal(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleJoin} className="modal-body">
              <div className="form-group">
                <label htmlFor="invite-sc">Invite code</label>
                <input
                  id="invite-sc"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. ABC12X"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn" disabled={joining}>
                  {joining ? "Joining…" : "Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
