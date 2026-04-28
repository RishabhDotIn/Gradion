function StudentStats({ stats }) {
  return (
    <div className="dashboard-stats">
      <div className="dashboard-stat-card">
        <div className="stat-content">
          <span className="stat-label">Total Assignments Assigned</span>
          <span className="stat-value" id="totalAssignments">{stats.totalAssignments}</span>
          <div className="stat-trend up">
            <i className="fas fa-arrow-up" />
            <span>+2.15%</span>
            <span className="trend-text">Since last week</span>
          </div>
        </div>
        <div className="stat-icon purple">
          <i className="fas fa-book-open" />
        </div>
      </div>

      <div className="dashboard-stat-card">
        <div className="stat-content">
          <span className="stat-label">Completed Assignments</span>
          <span className="stat-value" id="completedAssignments">{stats.completedAssignments}</span>
          <div className="stat-trend up">
            <i className="fas fa-arrow-up" />
            <span>+5.10%</span>
            <span className="trend-text">Since last week</span>
          </div>
        </div>
        <div className="stat-icon green">
          <i className="fas fa-check-circle" />
        </div>
      </div>

      <div className="dashboard-stat-card">
        <div className="stat-content">
          <span className="stat-label">Pending Assignments</span>
          <span className="stat-value" id="pendingAssignments">{stats.pendingAssignments}</span>
          <div className="stat-trend down">
            <i className="fas fa-arrow-down" />
            <span>-1.25%</span>
            <span className="trend-text">Since last week</span>
          </div>
        </div>
        <div className="stat-icon orange">
          <i className="fas fa-clock" />
        </div>
      </div>

      <div className="dashboard-stat-card">
        <div className="stat-content">
          <span className="stat-label">Average Score / Performance</span>
          <span className="stat-value" id="averageScore">{stats.averageScore}</span>
          <div className="stat-trend up">
            <i className="fas fa-arrow-up" />
            <span>+3.45%</span>
            <span className="trend-text">Since last week</span>
          </div>
        </div>
        <div className="stat-icon pink">
          <i className="fas fa-chart-line" />
        </div>
      </div>
    </div>
  );
}

export default StudentStats;
