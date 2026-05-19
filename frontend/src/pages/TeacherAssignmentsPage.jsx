import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import '../styles/studentAssignments.css';

const TeacherAssignmentsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('open'); // 'all', 'open', 'closed' (default open)
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
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

  const classOptions = useMemo(() => {
    const m = new Map();
    assignments.forEach((a) => {
      const c = a.classId;
      if (c && typeof c === "object" && c._id) m.set(String(c._id), c.name || "Class");
    });
    return [...m.entries()];
  }, [assignments]);

  const filteredAssignments = assignments.filter((assignment) => {
    const statusForFilter = (assignment.rawStatus || assignment.status || '').toLowerCase();
    const matchesStatus = filter === "all" || statusForFilter === filter;
    const matchesTopic = selectedTopic === "all" || assignment.topic === selectedTopic;
    const cid = assignment.classId && typeof assignment.classId === "object" ? assignment.classId._id : assignment.classId;
    const matchesClass = selectedClass === "all" || String(cid) === selectedClass;
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesTopic && matchesClass && matchesSearch;
  });

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.TEACHER_ASSIGNMENTS);
        const normalized = (response.assignments || []).map((assignment) => {
          const originalDeadline = assignment.deadline ? new Date(assignment.deadline) : null;
          const now = new Date();
          const expired = originalDeadline ? (originalDeadline < now) : false;
          let raw = assignment.status ? assignment.status.toLowerCase() : 'published';
          // if deadline passed, treat as closed regardless of published flag
          if (expired) raw = 'closed';
          // map backend 'published' to 'open' for filtering and CSS
          const rawForFilter = raw === 'published' ? 'open' : raw;
          // display 'Open' for published to match student view
          const displayStatus = raw === 'published' ? 'Open' : (raw.charAt(0).toUpperCase() + raw.slice(1));
          const statusClass = raw === 'published' ? 'open' : raw;
          return {
            ...assignment,
            questionsCount: assignment.questions?.length || 0,
            rawStatus: rawForFilter,
            status: displayStatus,
            statusClass,
            attemptedCount: assignment.attemptedCount || 0,
            classStudentCount: assignment.classStudentCount || 0,
            deadlineRaw: originalDeadline,
            deadline: originalDeadline ? originalDeadline.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
          };
        });
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
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">All classes</option>
                {classOptions.map(([cid, name]) => (
                  <option key={cid} value={cid}>
                    {name}
                  </option>
                ))}
              </select>

              <select 
                className="filter-select"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="all">All topics</option>
                <option value="programming-fundamentals">Programming Fundamentals</option>
                <option value="data-structures">Data Structures</option>
                <option value="algorithms">Algorithms</option>
                <option value="web-development">Web Development</option>
                <option value="database">Database</option>
                <option value="oop">Object-Oriented Programming</option>
              </select>
              
              <select 
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
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
                    <span className="course-name">{assignment.classId?.name || assignment.topic}</span>
                    <span className={`status-label ${assignment.statusClass || assignment.status.toLowerCase()}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <h3 className="assignment-title">{assignment.title}</h3>
                  
                  {viewMode === 'list' && (
                    <p className="assignment-description">{assignment.description}</p>
                  )}
                  
                  <div className="assignment-meta">
                    {assignment.classId?.name ? (
                      <span className="meta-item"><i className="fas fa-chalkboard"></i> {assignment.classId.name}</span>
                    ) : null}
                    <span className="meta-item"><i className="fas fa-tag"></i> {assignment.topic}</span>
                    <span className="meta-item"><i className="fas fa-layer-group"></i> {assignment.difficulty}</span>
                    <span className="meta-item"><i className="fas fa-question-circle"></i> {assignment.questionsCount} Questions</span>
                    {assignment.classStudentCount > 0 && (
                      <span className="meta-item"><i className="fas fa-users"></i> {assignment.attemptedCount} / {assignment.classStudentCount} attempted</span>
                    )}
                  </div>
                </div>
                
                  <div className="card-bottom">
                  <div className={`due-date ${assignment.statusClass === 'closed' ? 'closed' : ''}`}>
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
