import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { marked } from "marked";
import DOMPurify from "dompurify";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import { STUDENT_MENU_ITEMS } from "../nav/studentMenu.js";
import "../styles/studentViewSubmission.css";

const StudentViewSubmissionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiCall(`${API_CONFIG.ENDPOINTS.SUBMISSIONS}/student/${id}`);
        setSubmission(data.submission || null);
      } catch (e) {
        toast.error(e.message || "Could not load submission");
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const emptyFeedbackHtml = "<p>No AI feedback stored for this submission.</p>";

  const feedbackHtml = useMemo(() => {
    const raw = submission?.aiFeedback || "";
    if (!raw) return "";
    return DOMPurify.sanitize(marked.parse(raw, { async: false }));
  }, [submission]);

  const mapLang = (lang) => {
    const l = (lang || "javascript").toLowerCase();
    if (l === "c++" || l === "cpp") return "cpp";
    return l;
  };

  if (loading || !submission) {
    return (
      <div className="dashboard-layout">
        <DashboardSidebar menuItems={studentMenuItems} />
        <div className="dashboard-main">
          <DashboardHeader user={user} />
          <div style={{ padding: "2rem", textAlign: "center" }}>
            {loading ? <i className="fas fa-spinner fa-spin" /> : <p>Submission not found.</p>}
          </div>
        </div>
      </div>
    );
  }

  const assignment = submission.assignment || {};
  const title = assignment.title || "Submission";
  const topic = assignment.topic || assignment.classId?.name || "";
  const submittedOn = submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "";
  const passLike = submission.status === "Graded" || submission.status === "Late";

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={studentMenuItems} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />

        <main className="view-submission-page">
          <button type="button" className="back-button" onClick={() => navigate("/my-submissions")}>
            <i className="fas fa-arrow-left" /> Back to Submissions
          </button>

          <header className="submission-header">
            <h1 className="submission-title">{title}</h1>
            <span className="course-badge">{topic}</span>
          </header>

          <div className="submission-status-cards">
            <div className="status-card">
              <div className={`status-icon ${passLike ? "pass" : "fail"}`}>
                <i className={`fas ${passLike ? "fa-check-circle" : "fa-times-circle"}`} />
              </div>
              <div className="status-info">
                <h4>Status</h4>
                <p className={passLike ? "pass-text" : "fail-text"}>{submission.status}</p>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon marks">
                <i className="fas fa-star" />
              </div>
              <div className="status-info">
                <h4>Score</h4>
                <p>
                  {submission.score != null ? submission.score : "—"}{" "}
                  <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>/ 100</span>
                </p>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon time">
                <i className="fas fa-shield-alt" />
              </div>
              <div className="status-info">
                <h4>Plagiarism similarity</h4>
                <p style={{ color: (submission.plagiarismScore || 0) > 80 ? "#b91c1c" : undefined }}>
                  {submission.plagiarismScore ?? 0}%
                </p>
              </div>
            </div>
          </div>

          {submission.plagiarismExplanation ? (
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}>{submission.plagiarismExplanation}</p>
          ) : null}

          <section className="question-card">
            <div className="question-card-header">
              <div className="q-header-left">
                <span className="question-number-badge">Question {(submission.questionIndex || 0) + 1}</span>
                <span className="question-marks-badge full">Language: {submission.language || "—"}</span>
              </div>
            </div>

            <div className="question-body">
              <h4 style={{ marginTop: 0 }}>AI feedback</h4>
              <div
                className="ai-feedback-md"
                style={{ marginBottom: "20px", lineHeight: 1.55 }}
                dangerouslySetInnerHTML={{ __html: feedbackHtml || emptyFeedbackHtml }}
              />

              {submission.teacherFeedback ? (
                <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                  <strong>Teacher notes</strong>
                  <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{submission.teacherFeedback}</p>
                </div>
              ) : null}

              <div className="editor-snapshot-container">
                <div className="editor-snapshot-header">
                  <div className="editor-header-left">
                    <div className="language-selector-mock">
                      {submission.language} <i className="fas fa-chevron-down" />
                    </div>
                    <span className="autosave-status">Submitted {submittedOn}</span>
                  </div>
                </div>
                <div className="editor-wrapper">
                  <Editor
                    height="320px"
                    language={mapLang(submission.language)}
                    theme="vs-dark"
                    value={submission.code || ""}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      wordWrap: "on",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentViewSubmissionPage;
