function DashboardStats({ stats }) {
  return (
    <div className="dashboard-stats">
      <div className="dashboard-stat-card"><div className="stat-content"><span className="stat-label">Total Assignments</span><span className="stat-value" id="totalAssignments">{stats.totalAssignments}</span><div className="stat-trend up"><i className="fas fa-arrow-up" /><span>+2.15%</span><span className="trend-text">Since last week</span></div></div><div className="stat-icon purple"><i className="fas fa-book-open" /></div></div>
      <div className="dashboard-stat-card"><div className="stat-content"><span className="stat-label">Total Students</span><span className="stat-value" id="totalStudents">{stats.totalStudents}</span><div className="stat-trend up"><i className="fas fa-arrow-up" /><span>+2.15%</span><span className="trend-text">Since last week</span></div></div><div className="stat-icon green"><i className="fas fa-users" /></div></div>
      <div className="dashboard-stat-card"><div className="stat-content"><span className="stat-label">Total Submissions</span><span className="stat-value" id="totalSubmissions">{stats.totalSubmissions}</span><div className="stat-trend up"><i className="fas fa-arrow-up" /><span>+2.15%</span><span className="trend-text">Since last week</span></div></div><div className="stat-icon orange"><i className="fas fa-file-alt" /></div></div>
      <div className="dashboard-stat-card"><div className="stat-content"><span className="stat-label">Pending Reviews</span><span className="stat-value" id="pendingReviews">{stats.pendingReviews}</span><div className="stat-trend up"><i className="fas fa-arrow-up" /><span>+2.15%</span><span className="trend-text">Since last week</span></div></div><div className="stat-icon pink"><i className="fas fa-clock" /></div></div>
    </div>
  );
}

export default DashboardStats;
