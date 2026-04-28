import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import '../styles/studentAssignments.css';

const TeacherAssignmentsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'closed'
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [assignments, setAssignments] = useState(() => {
    const mockData = [
      { id: 1, title: "Data Structures Midterm Report", topic: "Data Structures", difficulty: "Medium", questionsCount: 15, deadline: "Oct 24, 2026", status: "Published", description: "Comprehensive report on trees and graphs implementation." },
      { id: 2, title: "Algorithms Analytical Essay", topic: "Algorithms", difficulty: "Hard", questionsCount: 5, deadline: "Oct 28, 2026", status: "Published", description: "An in-depth analysis of sorting algorithms complexity." },
      { id: 3, title: "Database Weekly Quiz 4", topic: "Database", difficulty: "Medium", questionsCount: 20, deadline: "Oct 22, 2026", status: "Closed", description: "SQL normalization techniques and query optimization." },
      { id: 4, title: "Web Dev Project Proposal", topic: "Web Development", difficulty: "Easy", questionsCount: 10, deadline: "Nov 05, 2026", status: "Published", description: "Initial proposal for the semester-long React application." },
      { id: 5, title: "OOP Lab Sheets", topic: "Object-Oriented Programming", difficulty: "Hard", questionsCount: 12, deadline: "Oct 20, 2026", status: "Closed", description: "Detailed observations on inheritance and polymorphism." },
      { id: 6, title: "Programming Fundamentals Quiz", topic: "Programming Fundamentals", difficulty: "Easy", questionsCount: 25, deadline: "Oct 25, 2026", status: "Published", description: "Assessment covering loops, variables, and data types." },
    ];

    const stored = JSON.parse(localStorage.getItem("gradion_assignments") || "[]");
    const normalized = stored.map(a => ({
      ...a,
      questionsCount: a.questions?.length || 0,
      status: "Published"
    }));

    return [...mockData, ...normalized];
  });

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
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className={`assignment-card ${viewMode}`}>
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
                    <button className="action-btn primary" onClick={() => navigate(`/teacher/assignment/view/${assignment.id}`)}>
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
