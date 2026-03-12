/**
 * Teacher Dashboard JavaScript
 * Handles API calls and UI rendering for the teacher dashboard
 */

// API Base URL
const API_BASE_URL = '/api';

// DOM Elements
const elements = {
    // Stats
    totalAssignments: document.getElementById('totalAssignments'),
    totalStudents: document.getElementById('totalStudents'),
    totalSubmissions: document.getElementById('totalSubmissions'),
    pendingReviews: document.getElementById('pendingReviews'),
    
    // Tables
    assignmentsTableBody: document.querySelector('.data-table tbody'),
    submissionsList: document.querySelector('.submissions-list'),
    tableSection: document.getElementById('tableSection'),
    
    // Info
    tableInfo: document.querySelector('.table-info')
};

// Fallback/Mock Data (will be removed when database is finalized)
const mockData = {
    stats: {
        totalAssignments: 12,
        totalStudents: 156,
        totalSubmissions: 89,
        pendingReviews: 23
    },
    assignments: [
        {
            id: 1,
            title: 'Array Sum',
            deadline: '2026-04-10',
            submissions: 25,
            icon: 'fa-code',
            color: 'purple'
        },
        {
            id: 2,
            title: 'Sorting Problem',
            deadline: '2026-04-15',
            submissions: 18,
            icon: 'fa-sort',
            color: 'green'
        },
        {
            id: 3,
            title: 'Linked List',
            deadline: '2026-04-20',
            submissions: 12,
            icon: 'fa-link',
            color: 'orange'
        },
        {
            id: 4,
            title: 'Binary Search',
            deadline: '2026-04-25',
            submissions: 8,
            icon: 'fa-search',
            color: 'blue'
        },
        {
            id: 5,
            title: 'Graph Traversal',
            deadline: '2026-04-30',
            submissions: 5,
            icon: 'fa-project-diagram',
            color: 'pink'
        }
    ],
    submissions: [
        {
            id: 1,
            studentName: 'Rahul',
            assignmentTitle: 'Array Sum',
            submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            avatarColor: '6366f1'
        },
        {
            id: 2,
            studentName: 'Aman',
            assignmentTitle: 'Sorting Problem',
            submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            avatarColor: '10b981'
        },
        {
            id: 3,
            studentName: 'Priya',
            assignmentTitle: 'Linked List',
            submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            avatarColor: 'f97316'
        },
        {
            id: 4,
            studentName: 'Sneha',
            assignmentTitle: 'Binary Search',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            avatarColor: 'ec4899'
        },
        {
            id: 5,
            studentName: 'Vikram',
            assignmentTitle: 'Graph Traversal',
            submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            avatarColor: '3b82f6'
        }
    ]
};

// Icon mapping for assignments
const iconMap = {
    'default': { icon: 'fa-file-alt', color: 'purple' },
    'array': { icon: 'fa-code', color: 'purple' },
    'sort': { icon: 'fa-sort', color: 'green' },
    'link': { icon: 'fa-link', color: 'orange' },
    'search': { icon: 'fa-search', color: 'blue' },
    'graph': { icon: 'fa-project-diagram', color: 'pink' },
    'tree': { icon: 'fa-sitemap', color: 'green' },
    'stack': { icon: 'fa-layer-group', color: 'orange' },
    'queue': { icon: 'fa-bars', color: 'blue' }
};

// Avatar colors for submissions
const avatarColors = ['6366f1', '10b981', 'f97316', 'ec4899', '3b82f6', '8b5cf6', 'ef4444', '14b8a6'];

/**
 * Initialize the dashboard
 */
async function initDashboard() {
    try {
        // Load all dashboard data
        await Promise.all([
            loadDashboardStats(),
            loadRecentAssignments(),
            loadRecentSubmissions()
        ]);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Load fallback data if API fails
        loadFallbackData();
    }
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        renderStats(data);
    } catch (error) {
        console.error('Error loading stats:', error);
        // Use mock data as fallback
        renderStats(mockData.stats);
    }
}

/**
 * Load recent assignments (max 5)
 */
async function loadRecentAssignments() {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/recent?limit=5`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recent assignments');
        }

        const data = await response.json();
        const assignments = data.assignments || data;
        
        // Get latest 5 assignments (or less if fewer exist)
        const latestAssignments = assignments.slice(0, 5);
        renderAssignmentsTable(latestAssignments);
    } catch (error) {
        console.error('Error loading assignments:', error);
        // Use mock data as fallback
        renderAssignmentsTable(mockData.assignments);
    }
}

/**
 * Load recent submissions
 */
async function loadRecentSubmissions() {
    try {
        const response = await fetch(`${API_BASE_URL}/submissions/recent?limit=5`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recent submissions');
        }

        const data = await response.json();
        const submissions = data.submissions || data;
        renderSubmissionsList(submissions);
    } catch (error) {
        console.error('Error loading submissions:', error);
        // Use mock data as fallback
        renderSubmissionsList(mockData.submissions);
    }
}

/**
 * Render dashboard statistics with count animation
 */
function renderStats(stats) {
    if (elements.totalAssignments) {
        animateCount(elements.totalAssignments, stats.totalAssignments || 0);
    }
    if (elements.totalStudents) {
        animateCount(elements.totalStudents, stats.totalStudents || 0);
    }
    if (elements.totalSubmissions) {
        animateCount(elements.totalSubmissions, stats.totalSubmissions || 0);
    }
    if (elements.pendingReviews) {
        const pendingPercent = stats.pendingReviews || 0;
        if (typeof pendingPercent === 'number') {
            animateCount(elements.pendingReviews, pendingPercent, true);
        } else {
            elements.pendingReviews.textContent = pendingPercent;
        }
    }
}

/**
 * Animate count effect for stat cards
 * @param {HTMLElement} element - The element to update
 * @param {number} targetValue - The final value to reach
 * @param {boolean} isPercentage - Whether to show as percentage
 */
function animateCount(element, targetValue, isPercentage = false) {
    const duration = 1500; // Animation duration in ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const easeOutQuad = t => t * (2 - t); // Easing function for smooth effect
    
    let frame = 0;
    const startValue = 0;
    const increment = targetValue / totalFrames;
    
    const counter = setInterval(() => {
        frame++;
        const progress = easeOutQuad(frame / totalFrames);
        const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
        
        if (isPercentage) {
            const currentPercent = (startValue + (targetValue - startValue) * progress).toFixed(2);
            element.textContent = `${currentPercent}%`;
        } else {
            element.textContent = formatNumber(currentValue);
        }
        
        if (frame === totalFrames) {
            clearInterval(counter);
            // Ensure final value is exact
            if (isPercentage) {
                element.textContent = `${targetValue.toFixed(2)}%`;
            } else {
                element.textContent = formatNumber(targetValue);
            }
        }
    }, frameDuration);
}

/**
 * Render assignments table
 */
function renderAssignmentsTable(assignments) {
    if (!elements.assignmentsTableBody) return;

    // Check if no assignments
    if (!assignments || assignments.length === 0) {
        elements.assignmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table-message">
                    <div class="empty-state-inline">
                        <i class="fas fa-folder-open"></i>
                        <span>No assignments available for now.</span>
                    </div>
                </td>
            </tr>
        `;
        if (elements.tableInfo) {
            elements.tableInfo.textContent = 'Showing 0 assignments';
        }
        return;
    }

    // Render assignment rows
    const html = assignments.map((assignment, index) => {
        const iconData = getIconForAssignment(assignment.title);
        const formattedDate = formatDate(assignment.deadline);
        const submissionCount = assignment.submissions || assignment.submissionCount || 0;

        return `
            <tr data-id="${assignment.id || assignment._id}">
                <td>
                    <div class="table-title-cell">
                        <div class="title-icon ${iconData.color}">
                            <i class="fas ${iconData.icon}"></i>
                        </div>
                        <span>${escapeHtml(assignment.title)}</span>
                    </div>
                </td>
                <td>
                    <div class="date-cell">
                        <i class="far fa-calendar"></i>
                        ${formattedDate}
                    </div>
                </td>
                <td>
                    <div class="submissions-cell">
                        <span class="submissions-count">${submissionCount}</span>
                        <span class="submissions-label">students</span>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="View" onclick="viewAssignment('${assignment.id || assignment._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" title="Edit" onclick="editAssignment('${assignment.id || assignment._id}')">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" onclick="deleteAssignment('${assignment.id || assignment._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    elements.assignmentsTableBody.innerHTML = html;

    // Update table info
    if (elements.tableInfo) {
        elements.tableInfo.textContent = `Showing 1-${assignments.length} of ${assignments.length} assignments`;
    }
}

/**
 * Render submissions list
 */
function renderSubmissionsList(submissions) {
    if (!elements.submissionsList) return;

    // Check if no submissions
    if (!submissions || submissions.length === 0) {
        elements.submissionsList.innerHTML = `
            <div class="empty-state-inline">
                <i class="fas fa-inbox"></i>
                <span>No recent submissions.</span>
            </div>
        `;
        return;
    }

    // Render submission items
    const html = submissions.map((submission, index) => {
        const timeAgo = formatTimeAgo(submission.submittedAt || submission.createdAt);
        const avatarColor = submission.avatarColor || avatarColors[index % avatarColors.length];
        const studentName = submission.studentName || submission.student?.name || 'Unknown';
        const assignmentTitle = submission.assignmentTitle || submission.assignment?.title || 'Unknown';

        return `
            <div class="submission-item" data-id="${submission.id || submission._id}">
                <div class="submission-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=${avatarColor}&color=fff" alt="${escapeHtml(studentName)}">
                </div>
                <div class="submission-info">
                    <span class="submission-student">${escapeHtml(studentName)}</span>
                    <span class="submission-assignment">${escapeHtml(assignmentTitle)}</span>
                </div>
                <span class="submission-time">${timeAgo}</span>
            </div>
        `;
    }).join('');

    elements.submissionsList.innerHTML = html;
}

/**
 * Load fallback data when API fails
 */
function loadFallbackData() {
    renderStats(mockData.stats);
    renderAssignmentsTable(mockData.assignments);
    renderSubmissionsList(mockData.submissions);
}

/**
 * Get icon and color for assignment based on title
 */
function getIconForAssignment(title) {
    if (!title) return iconMap.default;
    
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('array') || lowerTitle.includes('code')) {
        return iconMap.array;
    } else if (lowerTitle.includes('sort')) {
        return iconMap.sort;
    } else if (lowerTitle.includes('link') || lowerTitle.includes('list')) {
        return iconMap.link;
    } else if (lowerTitle.includes('search') || lowerTitle.includes('binary')) {
        return iconMap.search;
    } else if (lowerTitle.includes('graph')) {
        return iconMap.graph;
    } else if (lowerTitle.includes('tree')) {
        return iconMap.tree;
    } else if (lowerTitle.includes('stack')) {
        return iconMap.stack;
    } else if (lowerTitle.includes('queue')) {
        return iconMap.queue;
    }
    
    // Random color for unknown types
    const colors = ['purple', 'green', 'orange', 'blue', 'pink'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return { icon: 'fa-file-alt', color: randomColor };
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return 'No deadline';
    
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format time ago
 */
function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
        return '1 day ago';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return formatDate(dateString);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * View assignment details
 */
function viewAssignment(id) {
    window.location.href = `./viewAssignment.html?id=${id}`;
}

/**
 * Edit assignment
 */
function editAssignment(id) {
    window.location.href = `./editAssignment.html?id=${id}`;
}

/**
 * Delete assignment
 */
async function deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete assignment');
        }

        // Reload assignments after deletion
        await loadRecentAssignments();
        await loadDashboardStats();
        
        // Show success message
        showNotification('Assignment deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting assignment:', error);
        showNotification('Failed to delete assignment', 'error');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    loadUserProfile();
});

// Load User Profile from localStorage
function loadUserProfile() {
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            
            // Update user name
            if (userNameEl && user.name) {
                userNameEl.textContent = user.name;
            } else if (userNameEl && user.email) {
                userNameEl.textContent = user.email.split('@')[0];
            }
            
            // Update avatar
            if (userAvatarEl && user.name) {
                userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=fff`;
            }
        } catch (e) {
            console.error('Error:', e);
        }
    }
}

// Export functions for global access
window.viewAssignment = viewAssignment;
window.editAssignment = editAssignment;
window.deleteAssignment = deleteAssignment;