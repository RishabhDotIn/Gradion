import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import '../styles/studentAssignments.css';

const TeacherAssignmentsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'closed'
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }, []);

  const teacherMenuItems = [
    { path: "/teacher-dashboard", icon: "fas fa-th-large", label: "Dashboard" },
    { path: "/create-assignment", icon: "fas fa-plus-circle", label: "Create Assignment" },
    { path: "/teacher-assignments", icon: "fas fa-book-open", label: "Assignments" },
    { path: "/submissions", icon: "fas fa-file-alt", label: "Submissions" },
    { path: "/students", icon: "fas fa-users", label: "Students" },
    { path: "/reports", icon: "fas fa-chart-bar", label: "Reports" },
  ];

  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = filter === 'all' || assignment.status.toLowerCase() === filter;
    const matchesTopic = selectedTopic === 'all' || assignment.topic === selectedTopic;
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         assignment.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesTopic && matchesSearch;
  });

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.ASSIGNMENTS);
        const normalized = (response.assignments || []).map((assignment) => ({
          ...assignment,
          questionsCount: assignment.questions?.length || 0,
          status: assignment.status ? assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1) : "Published",
        }));
        setAssignments(normalized);
      } catch {
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={teacherMenuItems} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        
        <main className="assignments-content">
          <header className="assignments-header">
            <div className="header-left">
              <h1>Manage Assignments</h1>
              <p>Create, edit, and monitor your curriculum assignments.</p>
            </div>
            
            <div className="header-right">
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search assignments..." 
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
                <option value="published">Published</option>
                <option value="closed">Closed</option>
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
            {loading ? <div>Loading assignments...</div> : filteredAssignments.map((assignment) => (
              <div key={assignment._id} className={`assignment-card ${viewMode}`}>
                <div className="card-top">
                  <div className="course-info">
                    <span className="course-name">{assignment.topic}</span>
                    <span className={`status-label ${assignment.status.toLowerCase()}`}>
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
                  <div className="card-actions">
                    <button className="action-btn primary" onClick={() => navigate(`/teacher/assignment/view/${assignment._id}`)}>
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherAssignmentsPage;
