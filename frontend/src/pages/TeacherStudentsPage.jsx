import { useState, useMemo } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import "../styles/teacherStudents.css";

const MOCK_STUDENTS = [
  { id: "st1", name: "Alex Rivera", email: "alex.rivera@example.com", joinedDate: "2024-01-15", status: "Active", avatar: "https://ui-avatars.com/api/?name=Alex+Rivera&background=6366f1&color=fff" },
  { id: "st2", name: "Sarah Chen", email: "sarah.chen@university.edu", joinedDate: "2024-02-10", status: "Active", avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=10b981&color=fff" },
  { id: "st3", name: "Marcus Thorne", email: "m.thorne@tech.com", joinedDate: "2024-02-20", status: "Inactive", avatar: "https://ui-avatars.com/api/?name=Marcus+Thorne&background=f59e0b&color=fff" },
  { id: "st4", name: "Elena Rodriguez", email: "elena.r@example.com", joinedDate: "2024-03-05", status: "Active", avatar: "https://ui-avatars.com/api/?name=Elena+Rodriguez&background=ef4444&color=fff" },
  { id: "st5", name: "David Kim", email: "d.kim@university.edu", joinedDate: "2024-03-12", status: "Active", avatar: "https://ui-avatars.com/api/?name=David+Kim&background=8b5cf6&color=fff" },
];

function TeacherStudentsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return { name: "Teacher", role: "Instructor" };
    try { return JSON.parse(userStr); } catch { return { name: "Teacher", role: "Instructor" }; }
  }, []);

  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleInviteStudent = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Inviting student:", inviteEmail);
      setIsSending(false);
      setShowInviteModal(false);
      setInviteEmail("");
      alert(`Invitation sent to ${inviteEmail}!`);
    }, 1500);
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="students-page-content">
          <div className="students-page-header">
            <div>
              <h1 className="page-title">My Students</h1>
              <p className="page-subtitle">Manage and invite students to your classes</p>
            </div>
            <button className="add-student-btn" onClick={() => setShowInviteModal(true)}>
              <i className="fas fa-plus"></i> Student
            </button>
          </div>

          <div className="students-stats-container">
            <div className="stat-card total-students">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-details">
                <span className="stat-label">Total Students</span>
                <h2 className="stat-value">{MOCK_STUDENTS.length}</h2>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i> 12%
              </div>
            </div>
            {/* You can add more stat cards here if needed */}
          </div>

          <div className="students-list-container">
            <div className="list-card">
              <div className="list-card-header">
                <h3>Student List</h3>
                <div className="list-actions">
                  <div className="search-box">
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="fas fa-search"></i>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Joined Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td>
                            <div className="student-profile-cell">
                              <img src={student.avatar} alt={student.name} className="student-avatar-small" />
                              <span className="student-name-bold">{student.name}</span>
                            </div>
                          </td>
                          <td>{student.email}</td>
                          <td>{new Date(student.joinedDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-tag ${student.status.toLowerCase()}`}>
                              {student.status}
                            </span>
                          </td>
                          <td>
                            <div className="table-row-actions">
                              <button className="row-action-btn" title="Message">
                                <i className="fas fa-envelope"></i>
                              </button>
                              <button className="row-action-btn delete" title="Remove">
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-results-cell">
                          <div className="no-results-content">
                            <i className="fas fa-search"></i>
                            <p>No students found matching your search.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-icon">
                <i className="fas fa-paper-plane"></i>
              </div>
              <h3>Invite Student</h3>
              <p>Send a request to join Gradion directly to their email.</p>
              <button className="close-modal" onClick={() => setShowInviteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleInviteStudent} className="modal-body">
              <div className="form-group">
                <label htmlFor="student-email">Email Address</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope"></i>
                  <input 
                    id="student-email"
                    type="email" 
                    placeholder="Enter student's email..." 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button type="submit" className="send-btn" disabled={isSending}>
                  {isSending ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Send Invitation
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
