import { useNavigate } from "react-router-dom";

function DashboardTables({ assignments, submissions }) {
  const navigate = useNavigate();
  return (
    <div className="tables-grid">
      <section className="upcoming-assignments-section" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="section-header">
          <h3 className="section-title">Recent Assignments</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="view-all-btn" onClick={() => { window.location.href = "./AssignmentTDashbd.html"; }}>View All</button>
            <button className="table-action-btn" type="button" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><i className="fas fa-ellipsis-v" /></button>
          </div>
        </div>

        <div className="assignments-table-container" style={{ flexGrow: 1 }}>
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Assignment Title</th>
                <th>Deadline</th>
                <th>Submissions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id || a._id}>
                  <td>
                    <div className="assignment-title-cell">
                      <div className="assignment-icon"><i className="fas fa-file-alt"></i></div>
                      <span>{a.title}</span>
                    </div>
                  </td>
                  <td>{a.deadline ? new Date(a.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "No deadline"}</td>
                  <td>
                    <span className="status-badge submitted">
                      {a.submissions || a.submissionCount || 0} students
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn view" title="View" onClick={() => navigate(`/teacher/assignment/view/${a.id || a._id}`)} style={{ padding: '6px 10px', width: 'auto', minWidth: '0' }}><i className="fas fa-eye" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="submissions-section">
        <div className="table-header"><h3 className="table-title">Recent Submissions</h3><button className="table-action-btn" type="button"><i className="fas fa-ellipsis-v" /></button></div>
        <div className="submissions-list">
          {submissions.map((s) => (
            <div className="submission-item" key={s.id || s._id}>
              <div className="submission-avatar"><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.studentName || s.student?.name || "Unknown")}&background=6366f1&color=fff`} alt={s.studentName || s.student?.name || "Unknown"} /></div>
              <div className="submission-info"><span className="submission-student">{s.studentName || s.student?.name || "Unknown"}</span><span className="submission-assignment">{s.assignmentTitle || s.assignment?.title || "Unknown"}</span></div>
              <span className="submission-time">{s.submittedAt ? "Recent" : "Recent"}</span>
            </div>
          ))}
        </div>
        <div className="table-footer"><button className="btn-view-all-outline" type="button" onClick={() => navigate("/submissions")}>View All Submissions<i className="fas fa-arrow-right" /></button></div>
      </div>
    </div>
  );
}

export default DashboardTables;
