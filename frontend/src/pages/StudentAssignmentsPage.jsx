import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import '../styles/studentAssignments.css';

const StudentAssignmentsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('all'); // 'all', 'not started', 'submitted'
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = filter === 'all' || assignment.status.toLowerCase().replace(' ', '-') === filter;
    const matchesTopic = selectedTopic === 'all' || assignment.topic === selectedTopic;
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         assignment.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesTopic && matchesSearch;
  });

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.ASSIGNMENTS_PUBLIC);
        setAssignments(response.assignments || []);
      } catch (error) {
        console.error('Failed to load assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={studentMenuItems} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        
        <main className="assignments-content student-view">
          <header className="assignments-header">
            <div className="header-left">
              <h1>Assignments</h1>
              <p>Manage your tasks, track progress, and submit work.</p>
            </div>
            
            <div className="header-right">
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search by title or topic..." 
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
              
              <select 
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="not started">Not Started</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
          </header>

          <div className="view-controls">
            <span className="showing-text">Showing <b>{filteredAssignments.length}</b> assignments</span>
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
            {loading ? (
              <div className="loading-state">Loading assignments...</div>
            ) : filteredAssignments.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-book-open"></i>
                <h3>No assignments found</h3>
                <p>Check back later for new assignments.</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className={`assignment-card ${viewMode}`}>
                  <div className="card-top">
                    <div className="course-info">
                      <span className="course-name">{assignment.topic}</span>
                      <span className={`status-label ${assignment.status.toLowerCase().replace(' ', '-')}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <h3 className="assignment-title">{assignment.title}</h3>
                    
                    {viewMode === 'list' && (
                      <p className="assignment-description">{assignment.description}</p>
                    )}
                    
                    <div className="assignment-meta">
                      <span className="meta-item"><i className="fas fa-tag"></i> {assignment.topic}</span>
                      <span className="meta-item"><i className="fas fa-layer-group"></i> {assignment.difficulty}</span>
                      <span className="meta-item"><i className="fas fa-question-circle"></i> {assignment.questionsCount} Questions</span>
                    </div>
                  </div>
                  
                  <div className="card-bottom">
                    <div className="due-date">
                      <i className="far fa-calendar"></i>
                      <span>{assignment.deadline}</span>
                    </div>
                    <button 
                      className={`action-btn ${assignment.status === 'Not started' ? 'primary' : 'secondary'}`}
                      onClick={() => navigate(`/assignment/${assignment.id}`)}
                    >
                      {assignment.status === 'Not started' ? 'Start' : 'View Details'}
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

export default StudentAssignmentsPage;
