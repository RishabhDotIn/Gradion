// filepath: c:\Users\IRFAN\Desktop\GradionPro\Gradion\Public\Js\teacherDashboard.js

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initDashboard();
    initEventListeners();
});

// ============================================
// AUTHENTICATION CHECK
// ============================================
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        window.location.href = './login.html';
        return;
    }

    // Check if user is a teacher
    if (user.role !== 'teacher') {
        alert('Access denied. This page is for teachers only.');
        window.location.href = './login.html';
        return;
    }

    // Update UI with user info
    updateUserInfo(user);
}

function updateUserInfo(user) {
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    const userAvatar = document.querySelector('.user-avatar img');

    if (userName) userName.textContent = user.fullName || 'Teacher';
    if (userRole) userRole.textContent = user.role || 'teacher';
    if (userAvatar) {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=3B82F6&color=fff`;
    }
}

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
function initDashboard() {
    loadAssignments();
    updateStats();
}

// ============================================
// SAMPLE DATA (For Demo)
// ============================================
function getSampleAssignments() {
    return [
        {
            id: 1,
            title: 'Data Structures: Trees & Graphs',
            description: 'Implement a binary search tree and perform various traversal algorithms. Focus on time complexity.',
            topic: 'Computer Science',
            difficulty: 'hard',
            status: 'ongoing',
            tasks: 5,
            dueDate: 'Oct 25, 2023',
            createdAt: '2023-10-01'
        },
        {
            id: 2,
            title: 'Intro to React Hooks',
            description: 'Create a task manager using useState, useEffect, and custom hooks for persistent storage.',
            topic: 'Web Development',
            difficulty: 'medium',
            status: 'not-started',
            tasks: 3,
            dueDate: 'Oct 28, 2023',
            createdAt: '2023-10-05'
        },
        {
            id: 3,
            title: 'Linear Algebra: Vector Spaces',
            description: 'Solve sets of linear equations and determine the basis of provided subspaces.',
            topic: 'Mathematics',
            difficulty: 'easy',
            status: 'completed',
            tasks: 10,
            dueDate: 'Nov 2, 2023',
            createdAt: '2023-10-08'
        },
        {
            id: 4,
            title: 'Operating Systems: Scheduling',
            description: 'Simulate First-Come-First-Serve and Round Robin scheduling algorithms.',
            topic: 'Computer Science',
            difficulty: 'hard',
            status: 'ongoing',
            tasks: 4,
            dueDate: 'Nov 5, 2023',
            createdAt: '2023-10-10'
        },
        {
            id: 5,
            title: 'Database Normalization',
            description: 'Convert a flat data structure into 3NF. Ensure all functional dependencies are handled.',
            topic: 'Data Systems',
            difficulty: 'medium',
            status: 'not-started',
            tasks: 6,
            dueDate: 'Nov 10, 2023',
            createdAt: '2023-10-12'
        },
        {
            id: 6,
            title: 'Algorithms: Dynamic Programming',
            description: 'Solve the Knapsack problem using a bottom-up dynamic programming approach.',
            topic: 'Algorithms',
            difficulty: 'hard',
            status: 'not-started',
            tasks: 2,
            dueDate: 'Nov 12, 2023',
            createdAt: '2023-10-15'
        }
    ];
}

// ============================================
// LOAD ASSIGNMENTS
// ============================================
function loadAssignments() {
    // Get assignments from localStorage or use sample data
    let assignments = JSON.parse(localStorage.getItem('gradion_assignments') || 'null');
    
    // If no assignments, use sample data for demo
    if (!assignments || assignments.length === 0) {
        assignments = getSampleAssignments();
        localStorage.setItem('gradion_assignments', JSON.stringify(assignments));
    }

    renderAssignments(assignments);
}

function renderAssignments(assignments) {
    const grid = document.getElementById('assignmentsGrid');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');

    if (!assignments || assignments.length === 0) {
        // Show empty state
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        pagination.style.display = 'none';
        return;
    }

    // Show assignments
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    pagination.style.display = 'flex';

    grid.innerHTML = assignments.map(assignment => createAssignmentCard(assignment)).join('');
    
    // Update total count
    document.getElementById('totalCount').textContent = assignments.length;
}

function createAssignmentCard(assignment) {
    const statusIcon = {
        'ongoing': 'fa-clock',
        'completed': 'fa-check-circle',
        'not-started': 'fa-circle'
    };

    const statusText = {
        'ongoing': 'ongoing',
        'completed': 'completed',
        'not-started': 'not started'
    };

    return `
        <div class="assignment-card" data-id="${assignment.id}">
            <div class="card-header">
                <div class="card-badges">
                    <span class="difficulty-badge ${assignment.difficulty}">${assignment.difficulty}</span>
                </div>
                <span class="status-badge ${assignment.status}">
                    <i class="fas ${statusIcon[assignment.status]}"></i>
                    ${statusText[assignment.status]}
                </span>
            </div>
            <h3 class="card-title">${assignment.title}</h3>
            <p class="card-description">${assignment.description}</p>
            <div class="card-meta">
                <span class="card-topic">
                    <i class="fas fa-bookmark"></i>
                    ${assignment.topic}
                </span>
                <span class="card-tasks">
                    <i class="fas fa-tasks"></i>
                    ${assignment.tasks} Tasks
                </span>
            </div>
            <div class="card-due">
                <i class="fas fa-calendar-alt"></i>
                Due ${assignment.dueDate}
            </div>
            <div class="card-footer">
                <button class="card-action" onclick="editAssignment(${assignment.id})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <div class="card-more">
                    <button class="card-more-btn delete" onclick="deleteAssignment(${assignment.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="card-more-btn" title="More options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats() {
    const assignments = JSON.parse(localStorage.getItem('gradion_assignments') || '[]');
    
    const total = assignments.length;
    const inProgress = assignments.filter(a => a.status === 'ongoing').length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const avgScore = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Animate counters
    animateCounter('totalAssignments', total);
    animateCounter('inProgress', inProgress);
    animateCounter('completed', completed);
    animateCounter('avgScore', avgScore, '%');
}

function animateCounter(elementId, target, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const duration = 1000;
    const increment = target / (duration / 16);

    function update() {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
        } else {
            element.textContent = Math.floor(current) + suffix;
            requestAnimationFrame(update);
        }
    }

    update();
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Create Assignment button
    const createBtns = document.querySelectorAll('.btn-create');
    createBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = './createAssignment.html';
        });
    });

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAssignments(tab.dataset.filter);
        });
    });

    // Topic filter
    const topicFilter = document.getElementById('topicFilter');
    if (topicFilter) {
        topicFilter.addEventListener('change', () => {
            filterAssignments();
        });
    }

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            sortAssignments(sortFilter.value);
        });
    }

    // View options (grid/list)
    const viewOptions = document.querySelectorAll('.view-option');
    viewOptions.forEach(option => {
        option.addEventListener('click', () => {
            viewOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            // Toggle view mode (future feature)
        });
    });

    // Search
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            searchAssignments(e.target.value);
        }, 300));
    }

    // Create New tab
    const createNewTab = document.querySelector('.nav-tab:nth-child(2)');
    if (createNewTab) {
        createNewTab.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = './createAssignment.html';
        });
    }
}

// ============================================
// FILTER & SEARCH
// ============================================
function filterAssignments(status = 'all') {
    let assignments = JSON.parse(localStorage.getItem('gradion_assignments') || '[]');

    if (status === 'active') {
        assignments = assignments.filter(a => a.status === 'ongoing' || a.status === 'not-started');
    } else if (status === 'archived') {
        assignments = assignments.filter(a => a.status === 'completed');
    }

    // Apply topic filter
    const topicFilter = document.getElementById('topicFilter');
    if (topicFilter && topicFilter.value !== 'all') {
        const topic = topicFilter.value.replace('-', ' ');
        assignments = assignments.filter(a => 
            a.topic.toLowerCase().includes(topic.toLowerCase())
        );
    }

    renderAssignments(assignments);
}

function sortAssignments(sortBy) {
    let assignments = JSON.parse(localStorage.getItem('gradion_assignments') || '[]');

    switch (sortBy) {
        case 'newest':
            assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            assignments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'name':
            assignments.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'due':
            assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            break;
    }

    renderAssignments(assignments);
}

function searchAssignments(query) {
    let assignments = JSON.parse(localStorage.getItem('gradion_assignments') || '[]');

    if (query.trim()) {
        const q = query.toLowerCase();
        assignments = assignments.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.description.toLowerCase().includes(q) ||
            a.topic.toLowerCase().includes(q)
        );
    }

    renderAssignments(assignments);
}

// ============================================
// CRUD OPERATIONS
// ============================================
function editAssignment(id) {
    window.location.href = `./createAssignment.html?edit=${id}`;
}

function deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    let assignments = JSON.parse(localStorage.getItem('gradion_assignments') || '[]');
    assignments = assignments.filter(a => a.id !== id);
    localStorage.setItem('gradion_assignments', JSON.stringify(assignments));

    loadAssignments();
    updateStats();
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './login.html';
}

// ============================================
// UTILITIES
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}