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
                // Ensure API_CONFIG is available
                if (typeof API_CONFIG === 'undefined') {
                    throw new Error('API Configuration not loaded. Please reload the page.');
                }
                
                const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`;
                console.log('Login API URL:', apiUrl);
                console.log('Login payload:', { email, password, rememberMe });
                
                const response = await fetch(apiUrl, {
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
                
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }
                
                // Verify we have a success response
                if (!data.success) {
                    throw new Error(data.message || 'Login was not successful');
                }
                
                // Store JWT token
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    console.log('Token stored successfully');
                }
                
                // Store user info if available
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    console.log('User data stored:', data.user);
                } else {
                    // Fallback: at least store the email
                    localStorage.setItem('user', JSON.stringify({ email: email }));
                    console.log('No user data from server, stored minimal data');
                }
                
                // Success - update UI
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                submitBtn.style.background = '#22c55e';
                
                console.log('Login successful, preparing redirect in 1.5 seconds...');
                
                setTimeout(() => {
                    try {
                        let redirectUrl = './index.html'; // Default for students
                        
                        // Check user role from data
                        if (data.user && data.user.role === 'teacher') {
                            redirectUrl = './TeacherDashboard.html';
                            console.log('User is teacher, redirecting to:', redirectUrl);
                        } else {
                            console.log('User is student, redirecting to:', redirectUrl);
                        }
                        
                        console.log('Executing redirect to:', redirectUrl);
                        window.location.href = redirectUrl;
                    } catch (redirectError) {
                        console.error('Redirect error:', redirectError);
                        showError('Login successful but could not redirect. Please navigate manually.');
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Login error:', error);
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