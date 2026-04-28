import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '../../styles/performanceCard.css';

const TeacherPerformanceCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [improvement, setImprovement] = useState(0);

  useEffect(() => {
    // Generate data for the last 5 months
    const generateData = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      const currentMonthIndex = currentDate.getMonth();
      
      const mockData = [];
      // Let's generate some realistic looking assignment counts
      const baseCount = 10;
      
      for (let i = 4; i >= 0; i--) {
        let monthIndex = currentMonthIndex - i;
        if (monthIndex < 0) {
          monthIndex += 12;
        }
        
        const count = baseCount + Math.floor(Math.random() * 15);
        mockData.push({
          name: months[monthIndex],
          shortName: months[monthIndex],
          score: count, // Using 'score' to reuse the same AreaChart keys as PerformanceCard
          trend: count * 0.8 + (Math.random() * 5)
        });
      }
      
      setData(mockData);
      
      // Calculate improvement
      if (mockData.length >= 2) {
        const current = mockData[mockData.length - 1].score;
        const last = mockData[mockData.length - 2].score;
        const imp = Math.round(((current - last) / (last || 1)) * 100);
        setImprovement(imp);
      }
      
      setLoading(false);
    };

    // Simulate API delay
    setTimeout(generateData, 500);
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
    <div className="performance-card compact">
      <div className="performance-header">
        <h3 className="performance-title">Performance</h3>
      </div>
      
      <div className="performance-chart-container">
        <ResponsiveContainer width="100%" height={140}>
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
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
              interval={0}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '10px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
              cursor={{ stroke: '#6C63FF', strokeWidth: 1, strokeDasharray: '5 5' }}
              formatter={(value) => [`${value} Assignments`, 'Created']}
              labelFormatter={(label) => `Month: ${label}`}
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
        <div className="improvement-value">{improvement > 0 ? `+${improvement}%` : `${improvement}%`}</div>
        <div className="improvement-text">
          Assignment creation {improvement >= 0 ? 'increased' : 'decreased'} by {Math.abs(improvement)}%<br />
          compared to last month
        </div>
      </div>
    </div>
  );
};

export default TeacherPerformanceCard;
