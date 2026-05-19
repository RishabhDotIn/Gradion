import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import { apiCall, API_CONFIG } from '../lib/apiConfig.js';
import { STUDENT_MENU_ITEMS } from '../nav/studentMenu.js';
import '../styles/studentAssignments.css';

const StudentAssignmentsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('open'); // default open
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

  const studentMenuItems = STUDENT_MENU_ITEMS;

  const classOptions = useMemo(() => {
    const m = new Map();
    assignments.forEach((a) => {
      const c = a.classId;
      if (c && typeof c === "object" && c._id) m.set(String(c._id), c.name || "Class");
    });
    return [...m.entries()];
  }, [assignments]);

  const filteredAssignments = assignments.filter((assignment) => {
    const open = assignment.statusLabel === "Open";
    const matchesStatus =
      filter === "all" || (filter === "open" && open) || (filter === "closed" && !open);
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
        const response = await apiCall(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS_STUDENT}?limit=50`);
        const raw = response.assignments || [];
        const normalized = raw.map((a) => {
          const deadline = a.deadline ? new Date(a.deadline) : null;
          const open = deadline && deadline > new Date();
          return {
            ...a,
            id: a._id,
            questionsCount: a.questions?.length || 0,
            deadline: deadline ? deadline.toLocaleDateString() : "",
            status: open ? "Not started" : "Closed",
            statusLabel: open ? "Open" : "Closed",
            difficulty: a.difficulty ? a.difficulty.charAt(0).toUpperCase() + a.difficulty.slice(1) : "",
          };
        });
        setAssignments(normalized);
      } catch (error) {
        console.error("Failed to load assignments:", error);
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
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="closed">Past deadline</option>
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
                <div key={assignment.id || assignment._id} className={`assignment-card ${viewMode}`}>
                  <div className="card-top">
                    <div className="course-info">
                      <span className="course-name">{assignment.classId?.name || assignment.topic}</span>
                      <span className={`status-label ${(assignment.statusLabel || assignment.status || "").toLowerCase().replace(" ", "-")}`}>
                        {assignment.statusLabel || assignment.status}
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
                    </div>
                  </div>
                  
                      <div className="card-bottom">
                        <div className="due-date">
                          <i className="far fa-calendar"></i>
                          <span>{assignment.deadline}</span>
                        </div>
                        {assignment.hasSubmission ? (
                          <button
                            className={`action-btn secondary`}
                            onClick={() => {
                              const sid = assignment.submission?.submissionId || assignment.submission?._id || null;
                              if (sid) navigate(`/student/submission/${sid}`);
                              else navigate(`/assignment/${assignment.id || assignment._id}`);
                            }}
                          >
                            View Submission
                          </button>
                        ) : (
                          <button 
                            className={`action-btn ${assignment.status === 'Not started' || assignment.status === 'Open' ? 'primary' : 'secondary'}`}
                            onClick={() => navigate(`/assignment/${assignment.id || assignment._id}`)}
                          >
                            {assignment.status === 'Not started' || assignment.status === 'Open' ? 'Start' : 'View Details'}
                          </button>
                        )}
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
