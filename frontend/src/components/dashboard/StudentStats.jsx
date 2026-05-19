function computeChange(current, previous) {
  if (previous == null) return null;
  if (previous === 0) {
    if (current === 0) return { text: '0%', dir: 'neutral' };
    return { text: 'New', dir: 'up' };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100 * 100) / 100; // two decimals
  const sign = pct > 0 ? '+' : '';
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';
  return { text: `${sign}${pct}%`, dir };
}

function StatCard({ label, value, prevValue, iconClass, colorClass }) {
  const change = computeChange(typeof value === 'number' ? value : parseInt(value, 10) || 0, prevValue);
  return (
    <div className="dashboard-stat-card">
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {change ? (
          <div className={`stat-trend ${change.dir}`}>
            <i className={`fas ${change.dir === 'up' ? 'fa-arrow-up' : change.dir === 'down' ? 'fa-arrow-down' : 'fa-minus'}`} />
            <span>{change.text}</span>
            <span className="trend-text">Since last week</span>
          </div>
        ) : null}
      </div>
      <div className={`stat-icon ${colorClass}`}>
        <i className={iconClass} />
      </div>
    </div>
  );
}

function StudentStats({ stats }) {
  const prev = stats && stats.previousWeek ? stats.previousWeek : null;
  return (
    <div className="dashboard-stats">
      <StatCard label="Total Assignments Assigned" value={stats.totalAssignments} prevValue={prev?.totalAssignments} iconClass="fas fa-book-open" colorClass="purple" />
      <StatCard label="Completed Assignments" value={stats.completedAssignments} prevValue={prev?.completedAssignments} iconClass="fas fa-check-circle" colorClass="green" />
      <StatCard label="Pending Assignments" value={stats.pendingAssignments} prevValue={prev?.pendingAssignments} iconClass="fas fa-clock" colorClass="orange" />
      <StatCard label="Average Score / Performance" value={stats.averageScore} prevValue={prev?.averageScore} iconClass="fas fa-chart-line" colorClass="pink" />
    </div>
  );
}

export default StudentStats;
