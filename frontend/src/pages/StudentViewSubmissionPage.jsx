import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import AIAnalysisSidebar from '../components/dashboard/AIAnalysisSidebar.jsx';
import '../styles/studentViewSubmission.css';

const StudentViewSubmissionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);

  const handleAnalyzeAI = (q) => {
    // Map data to match sidebar expectations
    const questionData = {
      number: submission.questions.indexOf(q) + 1,
      title: submission.title,
      text: q.questionText,
      submittedCode: q.code
    };
    setActiveQuestion(questionData);
    setIsAISidebarOpen(true);
  };

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

  useEffect(() => {
    // Mock fetching submission details based on ID
    const mockSubmissionDetails = {
      id: id,
      title: "Data Structures & Algorithms: Java Final",
      topic: "Computer Science",
      submittedOn: "Oct 24, 2026, 14:30",
      timeTaken: "45 mins",
      totalMarks: 50,
      obtainedMarks: 45,
      status: "Pass",
      questions: [
        {
          id: 1,
          questionText: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
          language: "java",
          marksAwarded: 10,
          maxMarks: 10,
          code: `class Solution {
    public String longestCommonPrefix(String[] strs) {
        if (strs == null || strs.length == 0) return "";
        String prefix = strs[0];
        for (int i = 1; i < strs.length; i++) {
            while (strs[i].indexOf(prefix) != 0) {
                prefix = prefix.substring(0, prefix.length() - 1);
                if (prefix.isEmpty()) return "";
            }
        }
        return prefix;
    }
}`,
          feedback: "Perfect implementation using the horizontal scanning approach. Time complexity is O(S) where S is the sum of all characters in all strings."
        },
        {
          id: 2,
          questionText: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
          language: "java",
          marksAwarded: 10,
          maxMarks: 10,
          code: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
          feedback: "Clean use of the Stack data structure. Correctly handles all edge cases."
        },
        {
          id: 3,
          questionText: "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
          language: "java",
          marksAwarded: 15,
          maxMarks: 20,
          code: `/**
 * Definition for a binary tree node.
 */
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> currentLevel = new ArrayList<>();
            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();
                currentLevel.add(node.val);
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
            result.add(currentLevel);
        }
        return result;
    }
}`,
          feedback: "Good attempt. You forgot to import List, ArrayList, Queue, and LinkedList. In a real environment, this would cause a compilation error, hence the 5-mark deduction."
        },
        {
          id: 4,
          questionText: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
          language: "java",
          marksAwarded: 10,
          maxMarks: 10,
          code: `class MinStack {
    private Stack<Integer> stack;
    private Stack<Integer> minStack;

    public MinStack() {
        stack = new Stack<>();
        minStack = new Stack<>();
    }
    
    public void push(int val) {
        stack.push(val);
        if (minStack.isEmpty() || val <= minStack.peek()) {
            minStack.push(val);
        }
    }
    
    public void pop() {
        if (stack.pop().equals(minStack.peek())) {
            minStack.pop();
        }
    }
    
    public int top() {
        return stack.peek();
    }
    
    public int getMin() {
        return minStack.peek();
    }
}`,
          feedback: "Excellent. The two-stack approach correctly ensures O(1) time for all operations."
        }
      ]
    };

    setSubmission(mockSubmissionDetails);
  }, [id]);

  if (!submission) {
    return (
      <div className="dashboard-layout">
        <DashboardSidebar menuItems={studentMenuItems} />
        <div className="dashboard-main">
          <DashboardHeader user={user} />
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading submission...</div>
        </div>
      </div>
    );
  }

  const isPass = submission.status.toLowerCase() === 'pass';

  return (
    <div className="dashboard-layout">
      <DashboardSidebar menuItems={studentMenuItems} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        
        <main className="view-submission-page">
          <button className="back-button" onClick={() => navigate('/my-submissions')}>
            <i className="fas fa-arrow-left"></i> Back to Submissions
          </button>

          <header className="submission-header">
            <h1 className="submission-title">{submission.title}</h1>
            <span className="course-badge">{submission.topic}</span>
          </header>

          <div className="submission-status-cards">
            <div className="status-card">
              <div className={`status-icon ${isPass ? 'pass' : 'fail'}`}>
                <i className={`fas ${isPass ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
              </div>
              <div className="status-info">
                <h4>Submission Status</h4>
                <p className={isPass ? 'pass-text' : 'fail-text'}>{submission.status}</p>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon marks">
                <i className="fas fa-star"></i>
              </div>
              <div className="status-info">
                <h4>Total Score</h4>
                <p>{submission.obtainedMarks} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {submission.totalMarks}</span></p>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon time">
                <i className="fas fa-clock"></i>
              </div>
              <div className="status-info">
                <h4>Time Taken</h4>
                <p>{submission.timeTaken}</p>
              </div>
            </div>
          </div>

          <div className="submission-questions-container">
            {submission.questions.map((q, index) => (
              <section key={q.id} className="question-card">
                <div className="question-card-header">
                  <div className="q-header-left">
                    <span className="question-number-badge">Question {index + 1}</span>
                    <span className={`question-marks-badge ${q.marksAwarded === q.maxMarks ? 'full' : q.marksAwarded > 0 ? 'partial' : 'zero'}`}>
                      Marks: {q.marksAwarded}/{q.maxMarks}
                    </span>
                  </div>
                  <button 
                    className="analyze-ai-btn"
                    onClick={() => handleAnalyzeAI(q)}
                  >
                    <i className="fas fa-magic"></i> Analyze with AI
                  </button>
                </div>
                
                <div className="question-body">
                  <p className="question-text-content">{q.questionText}</p>
                  
                  <div className="editor-snapshot-container">
                    <div className="editor-snapshot-header">
                      <div className="editor-header-left">
                        <div className="language-selector-mock">
                          {q.language} <i className="fas fa-chevron-down"></i>
                        </div>
                        <span className="autosave-status">AUTO-SAVE: ON</span>
                      </div>
                      <div className="mac-buttons">
                        <span className="mac-btn close"></span>
                        <span className="mac-btn minimize"></span>
                        <span className="mac-btn expand"></span>
                      </div>
                    </div>
                    <div className="editor-wrapper">
                      <Editor
                        height="300px"
                        language={q.language}
                        theme="vs-dark"
                        value={q.code}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          padding: { top: 16, bottom: 16 },
                          domReadOnly: true,
                          wordWrap: 'on',
                          lineNumbers: 'on',
                          folding: true,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      {/* AI Analysis Sidebar */}
      <AIAnalysisSidebar 
        isOpen={isAISidebarOpen} 
        onClose={() => setIsAISidebarOpen(false)} 
        question={activeQuestion}
        studentCode={activeQuestion?.submittedCode || ''}
      />
    </div>
  );
};

export default StudentViewSubmissionPage;
