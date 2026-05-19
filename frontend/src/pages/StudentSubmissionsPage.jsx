import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import { STUDENT_MENU_ITEMS } from "../nav/studentMenu.js";
import "../styles/studentAssignments.css";

const StudentSubmissionsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }, []);

  const studentMenuItems = STUDENT_MENU_ITEMS;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall(`${API_CONFIG.ENDPOINTS.SUBMISSIONS}/student`);
      const rows = (data.submissions || []).map((s) => ({
        id: s._id,
        title: s.assignment?.title || "Assignment",
        topic: s.assignment?.topic || s.assignment?.classId?.name || "General",
        difficulty: s.assignment?.difficulty || "",
        questionsCount: s.questionIndex != null ? `Q${(s.questionIndex || 0) + 1}` : "",
        deadline: s.assignment?.deadline ? new Date(s.assignment.deadline).toLocaleDateString() : "",
        status: s.status || "Pending",
        score: s.score != null ? `${s.score}/100` : "—",
        description: s.aiFeedback ? String(s.aiFeedback).slice(0, 120) : "",
      }));
      setSubmissions(rows);
    } catch (e) {
      toast.error(e.message || "Failed to load submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesTopic = selectedTopic === "all" || sub.topic === selectedTopic;
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <p>Review graded work, AI feedback, and plagiarism signals.</p>
            </div>

            <div className="header-right">
              <div className="search-bar">
                <i className="fas fa-search" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select className="filter-select" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                <option value="all">All topics</option>
                {[...new Set(submissions.map((s) => s.topic))].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <div className="view-controls">
            <span className="showing-text">
              Showing <b>{filteredSubmissions.length}</b> submissions
            </span>
            <div className="view-toggles">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <i className="fas fa-th-large" />
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <i className="fas fa-list" />
              </button>
            </div>
          </div>

          <div className={`assignments-container ${viewMode}`}>
            {loading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin" /> Loading submissions…
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox empty-icon" />
                <p>No submissions yet.</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div key={submission.id} className={`assignment-card ${viewMode}`}>
                  <div className="card-top">
                    <div className="course-info">
                      <span className="course-name">{submission.topic}</span>
                      <span className={`status-label ${(submission.status || "").toLowerCase()}`}>{submission.status}</span>
                    </div>
                    <h3 className="assignment-title">{submission.title}</h3>

                    {viewMode === "list" && submission.description ? (
                      <p className="assignment-description">{submission.description}</p>
                    ) : null}

                    <div className="assignment-meta">
                      <span className="meta-item">
                        <i className="fas fa-tag" /> {submission.topic}
                      </span>
                      {submission.difficulty ? (
                        <span className="meta-item">
                          <i className="fas fa-layer-group" /> {submission.difficulty}
                        </span>
                      ) : null}
                      {submission.score ? (
                        <span className="meta-item score-highlight">
                          <i className="fas fa-star" /> Score: {submission.score}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="card-bottom">
                    <div className="due-date">
                      <i className="far fa-calendar-check" />
                      <span>{submission.deadline || submission.questionsCount}</span>
                    </div>
                    <button type="button" className="action-btn secondary" onClick={() => navigate(`/student/submission/${submission.id}`)}>
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
