import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import '../../styles/performanceCard.css';

const TeacherPerformanceCard = ({ data = [], loading = false, dashboardTotals = {} }) => {
  const snapshot = useMemo(() => {
    const values = data
      .filter((item) => item && !item.empty && item.score != null)
      .map((item) => Number(item.score || 0))
      .filter((value) => Number.isFinite(value));
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const latest = values.length ? values[values.length - 1] : 0;
    const peak = values.length ? Math.max(...values) : 0;

    return { average, latest, peak };
  }, [data]);

  if (loading) {
    return (
      <div className="performance-card loading">
        <div className="spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="performance-card compact snapshot-card">
      <div className="performance-header performance-header-row">
        <div>
          <h3 className="performance-title">Class average marks</h3>
          <p className="performance-subtitle">Monthly average scores from graded submissions</p>
        </div>
        <div className="performance-header-stats">
          <div className="performance-stat-pill performance-stat-pill-header">
            <span className="pill-label">Total students</span>
            <strong>{dashboardTotals.totalStudents ?? 0}</strong>
          </div>
          <div className="performance-stat-pill performance-stat-pill-header">
            <span className="pill-label">Total submissions</span>
            <strong>{dashboardTotals.totalSubmissions ?? 0}</strong>
          </div>
          <div className="performance-stat-pill performance-stat-pill-header">
            <span className="pill-label">Total assignments</span>
            <strong>{dashboardTotals.totalAssignments ?? 0}</strong>
          </div>
        </div>
      </div>

      <div className="performance-chart-container">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} barCategoryGap="24%" barSize={26}>
            <XAxis 
              dataKey="shortName"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              dy={10}
              interval={0}
              padding={{ left: 8, right: 8 }}
              tickFormatter={(value) => (String(value).length > 14 ? `${String(value).slice(0, 13)}…` : value)}
            />
            <YAxis hide domain={[0, 'dataMax + 5']} />
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 8" />
            <ReferenceLine y={snapshot.average} stroke="rgba(99, 102, 241, 0.35)" strokeDasharray="6 6" />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '14px', 
                border: '1px solid rgba(226, 232, 240, 0.9)', 
                boxShadow: '0 14px 30px rgba(15,23,42,0.12)',
                background: 'rgba(255,255,255,0.96)',
                fontSize: '12px'
              }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
              formatter={(value) => [`${value}%`, 'Average marks']}
              labelFormatter={(label) => `Assignment: ${label}`}
            />
            <Bar dataKey="score" radius={[14, 14, 6, 6]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.empty ? 'transparent' : entry.attempted === false ? '#ef4444' : '#5b5ff6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default TeacherPerformanceCard;
