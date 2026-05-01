import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import '../styles/studentAssignments.css';

const StudentSubmissionsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [submissions, setSubmissions] = useState(() => {
    // Mock data for submitted assignments
    const mockData = [
      { id: 3, title: "Database Weekly Quiz 4", topic: "Database", difficulty: "Medium", questionsCount: 20, deadline: "Oct 22, 2026", status: "Submitted", score: "18/20", description: "SQL normalization techniques and query optimization." },
      { id: 5, title: "OOP Lab Sheets", topic: "Object-Oriented Programming", difficulty: "Hard", questionsCount: 12, deadline: "Oct 20, 2026", status: "Evaluated", score: "10/12", description: "Detailed observations on inheritance and polymorphism." },
      { id: 7, title: "React Components Assignment", topic: "Web Development", difficulty: "Medium", questionsCount: 15, deadline: "Oct 15, 2026", status: "Evaluated", score: "14/15", description: "Creating reusable UI components in React." }
    ];

    return mockData;
  });

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }, []);

  const studentMenuItems = [
    { path: "/student-dashboard", icon: "fas fa-th-large", label: "Dashboard" },
    { path: "/student-assignments", icon: "fas fa-book-open", label: "Assignments" },
    { path: "/my-submissions", icon: "fas fa-upload", label: "My Submissions" },
    { path: "/performance", icon: "fas fa-chart-line", label: "Performance" },
  ];

  const filteredSubmissions = submissions.filter(sub => {
    const matchesTopic = selectedTopic === 'all' || sub.topic === selectedTopic;
    const matchesSearch = sub.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         sub.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={studentMenuItems} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        
        <main className="assignments-content student-view">
          <header className="assignments-header">
            <div className="header-left">
              <h1>My Submissions</h1>
              <p>Review your submitted assignments and grades.</p>
            </div>
            
            <div className="header-right">
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search submissions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                className="filter-select"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="all">All Courses</option>
                <option value="Programming Fundamentals">Programming Fundamentals</option>
                <option value="Data Structures">Data Structures</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Web Development">Web Development</option>
                <option value="Database">Database</option>
                <option value="Object-Oriented Programming">Object-Oriented Programming</option>
              </select>
            </div>
          </header>

          <div className="view-controls">
            <span className="showing-text">Showing <b>{filteredSubmissions.length}</b> submissions</span>
            <div className="view-toggles">
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>

          <div className={`assignments-container ${viewMode}`}>
            {filteredSubmissions.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox empty-icon"></i>
                <p>No submissions found.</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div key={submission.id} className={`assignment-card ${viewMode}`}>
                  <div className="card-top">
                    <div className="course-info">
                      <span className="course-name">{submission.topic}</span>
                      <span className={`status-label ${submission.status.toLowerCase()}`}>
                        {submission.status}
                      </span>
                    </div>
                    <h3 className="assignment-title">{submission.title}</h3>
                    
                    {viewMode === 'list' && (
                      <p className="assignment-description">{submission.description}</p>
                    )}
                    
                    <div className="assignment-meta">
                      <span className="meta-item"><i className="fas fa-tag"></i> {submission.topic}</span>
                      <span className="meta-item"><i className="fas fa-layer-group"></i> {submission.difficulty}</span>
                      {submission.score && (
                        <span className="meta-item score-highlight"><i className="fas fa-star"></i> Score: {submission.score}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-bottom">
                    <div className="due-date">
                      <i className="far fa-calendar-check"></i>
                      <span>{submission.deadline}</span>
                    </div>
                    <button 
                      className="action-btn secondary"
                      onClick={() => navigate(`/student/submission/${submission.id}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentSubmissionsPage;
