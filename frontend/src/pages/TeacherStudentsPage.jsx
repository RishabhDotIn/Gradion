import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import "../styles/teacherStudents.css";

function TeacherStudentsPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("students"); // 'students' or 'classes'

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return { fullName: "Teacher", role: "Instructor" };
    try {
      return JSON.parse(userStr);
    } catch {
      return { fullName: "Teacher", role: "Instructor" };
    }
  }, []);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.CLASSES_TEACHER);
      setClasses(data.classes || []);
    } catch (e) {
      toast.error(e.message || "Failed to load classes");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const studentsFlat = useMemo(() => {
    const rows = [];
    for (const cls of classes) {
      const studs = cls.students || [];
      for (const st of studs) {
        const sid = typeof st === "object" && st ? st._id || st.id : st;
        rows.push({
          key: `${cls._id}-${sid}`,
          className: cls.name,
          inviteCode: cls.inviteCode,
          id: sid,
          name: typeof st === "object" && st ? st.fullName || "Student" : "Student",
          email: typeof st === "object" && st ? st.email || "" : "",
        });
      }
    }
    return rows;
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return studentsFlat.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
    );
  }, [studentsFlat, searchTerm]);

  const totalStudents = studentsFlat.length;

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      toast.error("Enter a class name.");
      return;
    }
    setCreating(true);
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.CLASSES, "POST", { name: newClassName.trim() });
      toast.success(`Class created. Invite code: ${data.class?.inviteCode || ""}`);
      setNewClassName("");
      setShowCreateModal(false);
      await loadClasses();
    } catch (err) {
      toast.error(err.message || "Could not create class");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="students-page-content">
          <div className="students-page-header">
            <div>
              <h1 className="page-title">{viewMode === "classes" ? "My Classes" : "My Students"}</h1>
              <p className="page-subtitle">{viewMode === "classes" ? "Classes you manage and their invite codes" : "Students enrolled in your classes (join via invite codes)"}</p>
            </div>
            <button className="add-student-btn" type="button" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-chalkboard-teacher" /> Create Class
            </button>
          </div>

          <div className="students-stats-container">
            <div
              className={`stat-card total-students ${viewMode === 'students' ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setViewMode('students')}
              onKeyDown={(e) => e.key === 'Enter' && setViewMode('students')}
            >
              <div className="stat-icon">
                <i className="fas fa-users" />
              </div>
              <div className="stat-details">
                <span className="stat-label">Total Students</span>
                <h2 className="stat-value">{loading ? "—" : totalStudents}</h2>
              </div>
            </div>
            <div
              className={`stat-card total-students ${viewMode === 'classes' ? 'active' : ''}`}
              style={{ borderColor: "#e0e7ff" }}
              role="button"
              tabIndex={0}
              onClick={() => setViewMode('classes')}
              onKeyDown={(e) => e.key === 'Enter' && setViewMode('classes')}
            >
              <div className="stat-icon" style={{ background: "#eef2ff" }}>
                <i className="fas fa-door-open" style={{ color: "#4f46e5" }} />
              </div>
              <div className="stat-details">
                <span className="stat-label">Active Classes</span>
                <h2 className="stat-value">{loading ? "—" : classes.length}</h2>
              </div>
            </div>
          </div>

          {/* Render either Classes or Students based on the big stat toggles (no small toggles) */}
          {viewMode === "classes" ? (
            classes.length > 0 ? (
              <div className="students-list-container" style={{ marginTop: "0.75rem" }}>
                <div className="list-card">
                  <div className="list-card-header">
                    <h3>Your classes & invite codes</h3>
                  </div>
                  <div className="table-responsive">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Invite code</th>
                          <th>Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((c) => (
                          <tr key={c._id}>
                            <td>{c.name}</td>
                            <td>
                              <code style={{ fontSize: "1rem", letterSpacing: "0.08em" }}>{c.inviteCode}</code>
                            </td>
                            <td>{(c.students && c.students.length) || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="students-list-container" style={{ marginTop: "0.75rem" }}>
                <div className="list-card">
                  <div className="list-card-header">
                    <h3>Your classes & invite codes</h3>
                  </div>
                  <div style={{ padding: "24px", color: "#64748b" }}>
                    No classes yet. Click Create Class to add your first class.
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="students-list-container" style={{ marginTop: "0.75rem" }}>
              <div className="list-card">
                <div className="list-card-header">
                  <h3>All enrolled students</h3>
                  <div className="list-actions">
                    <div className="search-box">
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <i className="fas fa-search" />
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="3" className="no-results-cell">
                            Loading…
                          </td>
                        </tr>
                      ) : filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student.key}>
                            <td>
                              <div className="student-profile-cell">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff`}
                                  alt=""
                                  className="student-avatar-small"
                                />
                                <span className="student-name-bold">{student.name}</span>
                              </div>
                            </td>
                            <td>{student.email || "—"}</td>
                            <td>{student.className}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="no-results-cell">
                            <div className="no-results-content">
                              <i className="fas fa-user-friends" />
                              <p>No students yet. Share an invite code from a class row above.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-icon">
                <i className="fas fa-chalkboard" />
              </div>
              <h3>Create class</h3>
              <p>A unique invite code (6–8 characters) is generated automatically for students to join.</p>
              <button type="button" className="close-modal" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="modal-body">
              <div className="form-group">
                <label htmlFor="class-name">Class name</label>
                <div className="input-with-icon">
                  <i className="fas fa-book" />
                  <input
                    id="class-name"
                    type="text"
                    placeholder="e.g. CS 101 — Web Development"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn" disabled={creating}>
                  {creating ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check" /> Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherStudentsPage;
