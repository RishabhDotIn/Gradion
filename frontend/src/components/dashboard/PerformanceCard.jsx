import React, { useEffect, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { apiCall } from '../../lib/apiConfig.js';
import '../../styles/performanceCard.css';

const PerformanceCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeChart = (items = []) => {
    const trimmed = items.slice(-5);
    while (trimmed.length < 5) {
      trimmed.unshift({ name: "", shortName: "", score: null, attempted: false, empty: true });
    }
    return trimmed;
  };

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const result = await apiCall('/api/performance');
        
        if (result.success) {
          const formattedData = Array.isArray(result.chart) && result.chart.length
            ? normalizeChart(result.chart)
            : Array.isArray(result.scores)
              ? normalizeChart(result.scores.map((score, index) => ({
                  name: `Assignment ${index + 1}`,
                  shortName: `Assig ${index + 1}`,
                  score,
                  attempted: true,
                })))
              : [];

          setData(formattedData);
          
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="performance-card loading">
        <div className="spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  const values = data
    .filter((item) => item && !item.empty && item.score != null)
    .map((item) => Number(item.score || 0))
    .filter((value) => Number.isFinite(value));
  const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const latest = values.length ? values[values.length - 1] : 0;
  const best = values.length ? Math.max(...values) : 0;

  return (
    <div className="performance-card snapshot-card">
      <div className="performance-header performance-header-row">
        <div>
          <h3 className="performance-title">Performance snapshot</h3>
          <p className="performance-subtitle">Recent assignment scores</p>
        </div>
        <div className="performance-header-stats">
          <div className="performance-stat-pill performance-stat-pill-header">
            <span className="pill-label">Latest</span>
            <strong>{latest}%</strong>
          </div>
          <div className="performance-stat-pill performance-stat-pill-header">
            <span className="pill-label">Average</span>
            <strong>{average}%</strong>
          </div>
          <div className="performance-stat-pill performance-stat-pill-header">
            <span className="pill-label">Best</span>
            <strong>{best}%</strong>
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
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              dy={10}
              interval={0}
              padding={{ left: 8, right: 8 }}
              tickFormatter={(value) => (String(value).length > 14 ? `${String(value).slice(0, 13)}…` : value)}
            />
            <YAxis hide domain={[0, 100]} />
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 8" />
            <ReferenceLine y={average} stroke="rgba(99, 102, 241, 0.35)" strokeDasharray="6 6" />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '14px', 
                border: '1px solid rgba(226, 232, 240, 0.9)', 
                boxShadow: '0 14px 30px rgba(15,23,42,0.12)',
                background: 'rgba(255,255,255,0.96)',
                fontSize: '12px'
              }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
              formatter={(value) => [`${value}%`, 'Score']}
              labelFormatter={(label) => `Assignment: ${label}`}
            />
            <Bar dataKey="score" radius={[14, 14, 6, 6]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.empty ? 'transparent' : entry.attempted === false ? '#ef4444' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceCard;
