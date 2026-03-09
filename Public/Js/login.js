document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggle();
    initFormSubmit();
});

// Password Toggle
function initPasswordToggle() {
    const toggleBtn = document.querySelector('.toggle-password');
    const passwordInput = document.querySelector('input[type="password"]');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            const icon = toggleBtn.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

// Form Submit
function initFormSubmit() {
    const form = document.getElementById('loginForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('input[type="email"]').value;
            const password = form.querySelector('input[type="password"]').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            
            // Loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        rememberMe
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }
                
                // Store JWT token
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                
                // Store user info if available
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                // Success - redirect to dashboard
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                submitBtn.style.background = '#22c55e';
                
                setTimeout(() => {
                    // Redirect based on user role
                    if (data.user && data.user.role === 'teacher') {
                        window.location.href = './AssignmentTDashbd.html';
                    } else {
                        window.location.href = './studentDashboard.html';
                    }
                }, 1000);
                
            } catch (error) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                showError(error.message || 'Login failed. Please check your credentials.');
            }
        });
    }
}

// Show error message
function showError(message) {
    // Remove existing error if any
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    // Insert before submit button
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}