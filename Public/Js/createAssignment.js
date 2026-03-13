// Create Assignment - Multi-Step Form Handler
// ============================================

// State Management
let currentStep = 1;
let questions = [];
let assignmentData = {
    title: '',
    description: '',
    topic: '',
    difficulty: '',
    deadline: '',
    numQuestions: 1
};

// DOM Elements
const stepItems = document.querySelectorAll('.step-item');
const stepLines = document.querySelectorAll('.step-line');
const formSteps = document.querySelectorAll('.form-step');
const questionsContainer = document.getElementById('questionsContainer');
const questionTemplate = document.getElementById('questionTemplate');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    initializeForm();
    setupEventListeners();
});

// Load User Profile from localStorage
function loadUserProfile() {
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            
            if (userNameEl && user.name) {
                userNameEl.textContent = user.name;
            } else if (userNameEl && user.email) {
                userNameEl.textContent = user.email.split('@')[0];
            }
            
            if (userAvatarEl && user.name) {
                userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=fff`;
            }
        } catch (e) {
            console.error('Error loading user:', e);
        }
    }
}

// Initialize Form
function initializeForm() {
    // Set minimum date for deadline (today)
    const today = new Date().toISOString().split('T')[0];
    const deadlineInput = document.getElementById('deadline');
    if (deadlineInput) {
        deadlineInput.setAttribute('min', today);
    }
    
    // Initialize with one question (without notification)
    addQuestion(true);
}

// Setup Event Listeners
function setupEventListeners() {
    // Number of questions change handler
    const numQuestionsInput = document.getElementById('numQuestions');
    if (numQuestionsInput) {
        numQuestionsInput.addEventListener('change', handleNumQuestionsChange);
    }
    
    // Form input change handlers for live validation
    const formInputs = document.querySelectorAll('#step1 input, #step1 select, #step1 textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', () => {
            saveAssignmentData();
        });
    });
}

// Navigate to Step
function goToStep(step) {
    // Validate current step before proceeding
    if (step > currentStep && !validateCurrentStep()) {
        return;
    }
    
    // Save data from current step
    if (currentStep === 1) {
        saveAssignmentData();
    } else if (currentStep === 2) {
        saveQuestionsData();
    }
    
    // Update step indicators
    updateStepIndicators(step);
    
    // Show/hide form steps with animation
    formSteps.forEach((formStep, index) => {
        if (index + 1 === step) {
            formStep.classList.add('active');
        } else {
            formStep.classList.remove('active');
        }
    });
    
    // Update current step
    currentStep = step;
    
    // If going to publish step, update summary
    if (step === 3) {
        updateSummary();
    }
    
    // Scroll to top of content
    document.querySelector('.dashboard-content').scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Update Step Indicators
function updateStepIndicators(targetStep) {
    stepItems.forEach((item, index) => {
        const stepNum = index + 1;
        
        // Remove all classes first
        item.classList.remove('active', 'completed');
        
        if (stepNum < targetStep) {
            item.classList.add('completed');
        } else if (stepNum === targetStep) {
            item.classList.add('active');
        }
    });
    
    // Update step lines
    stepLines.forEach((line, index) => {
        if (index < targetStep - 1) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
}

// Validate Current Step
function validateCurrentStep() {
    if (currentStep === 1) {
        return validateStep1();
    } else if (currentStep === 2) {
        return validateStep2();
    }
    return true;
}

// Validate Step 1 - Assignment Details
function validateStep1() {
    const title = document.getElementById('assignmentTitle').value.trim();
    const topic = document.getElementById('topic').value;
    const difficulty = document.getElementById('difficulty').value;
    const deadline = document.getElementById('deadline').value;
    const numQuestions = document.getElementById('numQuestions').value;
    
    const errors = [];
    
    if (!title) errors.push('Assignment title is required');
    if (!topic) errors.push('Please select a topic');
    if (!difficulty) errors.push('Please select difficulty level');
    if (!deadline) errors.push('Deadline is required');
    if (!numQuestions || numQuestions < 1) errors.push('Number of questions must be at least 1');
    
    if (errors.length > 0) {
        showNotification(errors[0], 'error');
        highlightInvalidFields();
        return false;
    }
    
    return true;
}

// Validate Step 2 - Questions
function validateStep2() {
    const questionCards = document.querySelectorAll('.question-card');
    
    if (questionCards.length === 0) {
        showNotification('Please add at least one question', 'error');
        return false;
    }
    
    let isValid = true;
    
    questionCards.forEach((card, index) => {
        const problemTitle = card.querySelector('.problem-title').value.trim();
        const problemDescription = card.querySelector('.problem-description').value.trim();
        const language = card.querySelector('.problem-language').value;
        const testInput = card.querySelector('.test-input').value.trim();
        const expectedOutput = card.querySelector('.expected-output').value.trim();
        
        if (!problemTitle || !problemDescription || !language || !testInput || !expectedOutput) {
            showNotification(`Please fill all required fields in Question ${index + 1}`, 'error');
            isValid = false;
            return;
        }
    });
    
    return isValid;
}

// Highlight Invalid Fields
function highlightInvalidFields() {
    const requiredFields = document.querySelectorAll('#step1 [required]');
    requiredFields.forEach(field => {
        if (!field.value) {
            field.style.borderColor = '#ef4444';
            field.addEventListener('input', function handler() {
                if (this.value) {
                    this.style.borderColor = '';
                    this.removeEventListener('input', handler);
                }
            });
        }
    });
}

// Save Assignment Data from Step 1
function saveAssignmentData() {
    assignmentData = {
        title: document.getElementById('assignmentTitle').value.trim(),
        description: document.getElementById('assignmentDescription').value.trim(),
        topic: document.getElementById('topic').value,
        topicText: document.getElementById('topic').options[document.getElementById('topic').selectedIndex]?.text || '',
        difficulty: document.getElementById('difficulty').value,
        difficultyText: document.getElementById('difficulty').options[document.getElementById('difficulty').selectedIndex]?.text || '',
        deadline: document.getElementById('deadline').value,
        numQuestions: parseInt(document.getElementById('numQuestions').value) || 1
    };
}

// Save Questions Data from Step 2
function saveQuestionsData() {
    questions = [];
    const questionCards = document.querySelectorAll('.question-card');
    
    questionCards.forEach((card, index) => {
        const languageSelect = card.querySelector('.problem-language');
        questions.push({
            index: index + 1,
            problemTitle: card.querySelector('.problem-title').value.trim(),
            problemDescription: card.querySelector('.problem-description').value.trim(),
            language: languageSelect.value,
            languageText: languageSelect.options[languageSelect.selectedIndex]?.text || '',
            starterCode: card.querySelector('.starter-code').value,
            testInput: card.querySelector('.test-input').value.trim(),
            expectedOutput: card.querySelector('.expected-output').value.trim()
        });
    });
}

// Handle Number of Questions Change
function handleNumQuestionsChange(e) {
    const targetCount = parseInt(e.target.value) || 1;
    const currentCount = document.querySelectorAll('.question-card').length;
    
    if (targetCount > currentCount) {
        // Add more questions
        for (let i = currentCount; i < targetCount; i++) {
            addQuestion();
        }
    } else if (targetCount < currentCount) {
        // Remove extra questions (from the end)
        const questionCards = document.querySelectorAll('.question-card');
        for (let i = currentCount - 1; i >= targetCount; i--) {
            questionCards[i].remove();
        }
    }
    
    updateQuestionNumbers();
}

// Add Question
function addQuestion(skipNotification = false) {
    const template = document.getElementById('questionTemplate');
    const clone = template.content.cloneNode(true);
    
    const questionCard = clone.querySelector('.question-card');
    const currentCount = document.querySelectorAll('.question-card').length + 1;
    
    // Set question number
    questionCard.querySelector('.q-num').textContent = currentCount;
    questionCard.setAttribute('data-question-index', currentCount);
    
    // Add animation class
    questionCard.style.opacity = '0';
    questionCard.style.transform = 'translateY(20px)';
    
    questionsContainer.appendChild(clone);
    
    // Animate in
    const addedCard = questionsContainer.lastElementChild;
    setTimeout(() => {
        addedCard.style.transition = 'all 0.3s ease';
        addedCard.style.opacity = '1';
        addedCard.style.transform = 'translateY(0)';
    }, 10);
    
    // Update the number of questions input
    const numQuestionsInput = document.getElementById('numQuestions');
    if (numQuestionsInput && currentStep === 2) {
        numQuestionsInput.value = currentCount;
    }
    
    // Only show notification if not skipped (e.g., on page load)
    if (!skipNotification) {
        showNotification(`Question ${currentCount} added`, 'success');
    }
}

// Delete Question
function deleteQuestion(button) {
    const questionCard = button.closest('.question-card');
    const totalQuestions = document.querySelectorAll('.question-card').length;
    
    if (totalQuestions <= 1) {
        showNotification('You must have at least one question', 'error');
        return;
    }
    
    // Animate out
    questionCard.style.transition = 'all 0.3s ease';
    questionCard.style.opacity = '0';
    questionCard.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        questionCard.remove();
        updateQuestionNumbers();
        
        // Update the number of questions input
        const numQuestionsInput = document.getElementById('numQuestions');
        const newCount = document.querySelectorAll('.question-card').length;
        if (numQuestionsInput) {
            numQuestionsInput.value = newCount;
        }
        
        showNotification('Question deleted', 'success');
    }, 300);
}

// Update Question Numbers
function updateQuestionNumbers() {
    const questionCards = document.querySelectorAll('.question-card');
    questionCards.forEach((card, index) => {
        card.querySelector('.q-num').textContent = index + 1;
        card.setAttribute('data-question-index', index + 1);
    });
}

// Update Summary (Step 3)
function updateSummary() {
    saveAssignmentData();
    saveQuestionsData();
    
    // Update summary values
    document.getElementById('summaryTitle').textContent = assignmentData.title || '-';
    document.getElementById('summaryTopic').textContent = assignmentData.topicText || '-';
    document.getElementById('summaryDifficulty').textContent = assignmentData.difficultyText || '-';
    document.getElementById('summaryQuestions').textContent = questions.length;
    
    // Format deadline
    if (assignmentData.deadline) {
        const date = new Date(assignmentData.deadline);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        document.getElementById('summaryDeadline').textContent = date.toLocaleDateString('en-US', options);
    } else {
        document.getElementById('summaryDeadline').textContent = '-';
    }
    
    // Update questions preview
    const questionsPreview = document.getElementById('questionsPreview');
    questionsPreview.innerHTML = '';
    
    if (questions.length === 0) {
        questionsPreview.innerHTML = `
            <div class="empty-questions">
                <i class="fas fa-question-circle"></i>
                <h3>No Questions Added</h3>
                <p>Go back to add questions to your assignment.</p>
            </div>
        `;
    } else {
        questions.forEach((q, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-question';
            previewItem.innerHTML = `
                <div class="preview-question-num">${index + 1}</div>
                <span class="preview-question-title">${q.problemTitle || 'Untitled Question'}</span>
                <span class="preview-question-lang">${q.languageText || 'N/A'}</span>
            `;
            questionsPreview.appendChild(previewItem);
        });
    }
}

// Publish Assignment
function publishAssignment() {
    saveQuestionsData();
    
    // Final validation
    if (!assignmentData.title) {
        showNotification('Assignment title is required', 'error');
        goToStep(1);
        return;
    }
    
    if (questions.length === 0) {
        showNotification('Please add at least one question', 'error');
        goToStep(2);
        return;
    }
    
    // Prepare data for submission
    const submissionData = {
        ...assignmentData,
        questions: questions,
        createdAt: new Date().toISOString(),
        status: 'published'
    };
    
    console.log('Publishing Assignment:', submissionData);
    
    // Show loading state
    const publishBtn = document.querySelector('.btn-publish');
    const originalContent = publishBtn.innerHTML;
    publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    publishBtn.disabled = true;
    
    // Simulate API call (replace with actual API call)
    setTimeout(() => {
        // Store in localStorage for demo
        saveToLocalStorage(submissionData);
        
        // Reset button
        publishBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        publishBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        
        showNotification('Assignment created successfully!', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = './AssignmentTDashbd.html';
        }, 1500);
    }, 1500);
}

// Save to LocalStorage (Demo)
function saveToLocalStorage(data) {
    const assignments = JSON.parse(localStorage.getItem('gradion_assignments') || '[]');
    data.id = Date.now();
    assignments.push(data);
    localStorage.setItem('gradion_assignments', JSON.stringify(assignments));
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles dynamically if not exists
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification-toast {
                position: fixed;
                top: 24px;
                right: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }
            
            .notification-toast i:first-child {
                font-size: 20px;
            }
            
            .notification-toast span {
                font-size: 14px;
                font-weight: 500;
                color: #1e293b;
            }
            
            .notification-success {
                border-left: 4px solid #10b981;
            }
            
            .notification-success i:first-child {
                color: #10b981;
            }
            
            .notification-error {
                border-left: 4px solid #ef4444;
            }
            
            .notification-error i:first-child {
                color: #ef4444;
            }
            
            .notification-info {
                border-left: 4px solid #3b82f6;
            }
            
            .notification-info i:first-child {
                color: #3b82f6;
            }
            
            .notification-warning {
                border-left: 4px solid #f59e0b;
            }
            
            .notification-warning i:first-child {
                color: #f59e0b;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 4px;
                margin-left: 8px;
                transition: color 0.2s;
            }
            
            .notification-close:hover {
                color: #1e293b;
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Make step items clickable
stepItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        const targetStep = index + 1;
        
        // Only allow clicking on completed steps or current step
        if (targetStep <= currentStep || item.classList.contains('completed')) {
            goToStep(targetStep);
        }
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    // Alt + Arrow keys for navigation
    if (e.altKey) {
        if (e.key === 'ArrowRight' && currentStep < 3) {
            goToStep(currentStep + 1);
        } else if (e.key === 'ArrowLeft' && currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }
});

// Prevent form submission on Enter key in inputs
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
    }
});

// Auto-save to localStorage periodically
setInterval(() => {
    if (currentStep === 1) {
        saveAssignmentData();
    } else if (currentStep === 2) {
        saveQuestionsData();
    }
    
    // Save draft
    const draft = {
        assignmentData,
        questions,
        currentStep,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('gradion_assignment_draft', JSON.stringify(draft));
}, 30000); // Save every 30 seconds

// Load draft on page load (optional)
function loadDraft() {
    const draft = localStorage.getItem('gradion_assignment_draft');
    if (draft) {
        const data = JSON.parse(draft);
        // You can implement draft restoration here
        console.log('Draft found:', data);
    }
}
