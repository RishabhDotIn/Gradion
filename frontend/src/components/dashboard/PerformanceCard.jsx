import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiCall } from '../../lib/apiConfig.js';
import '../../styles/performanceCard.css';

const PerformanceCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [improvement, setImprovement] = useState(0);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const result = await apiCall('/api/performance');
        
        if (result.success && result.scores) {
          const formattedData = result.scores.map((score, index) => ({
            name: `Assignment ${index + 1}`,
            shortName: `Assig ${index + 1}`,
            score: score,
            // Secondary trend line for comparison (slightly offset or smoothed)
            trend: score * 0.85 + (Math.random() * 10) 
          }));
          
          setData(formattedData);
          
          // Calculate improvement
          if (result.scores.length >= 2) {
            const current = result.scores[result.scores.length - 1];
            const last = result.scores[result.scores.length - 2];
            const imp = Math.round(((current - last) / last) * 100);
            setImprovement(imp);
          }
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

  return (
    <div className="performance-card">
      <div className="performance-header">
        <h3 className="performance-title">Performance</h3>
      </div>
      
      <div className="performance-chart-container">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 10, right: 25, left: 25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="shortName" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              dy={10}
              interval={0}
              padding={{ left: 30, right: 30 }}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '10px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
              cursor={{ stroke: '#6C63FF', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Area 
              type="monotone" 
              dataKey="trend" 
              stroke="#C7C4FF" 
              strokeWidth={2}
              fill="transparent" 
              dot={false}
              activeDot={false}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#6C63FF" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              dot={{ r: 4, fill: '#6C63FF', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#6C63FF', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="performance-footer">
        <div className="improvement-value">{improvement}%</div>
        <div className="improvement-text">
          Your performance improved by {improvement}%<br />
          compared to last assignments
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;
