document.addEventListener('DOMContentLoaded', () => {
    initRoleSelector();
    initPasswordToggle();
    initFormSubmit();
});

// Role Selector
function initRoleSelector() {
    const roleOptions = document.querySelectorAll('.role-option');
    
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected from all
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected to clicked
            option.classList.add('selected');
        });
    });
}

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
    const form = document.getElementById('registerForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = form.querySelector('input[type="text"]').value;
            const email = form.querySelector('input[type="email"]').value;
            const password = form.querySelector('input[type="password"]').value;
            const role = document.querySelector('.role-option.selected').dataset.role;
            
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            
            // Loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            submitBtn.disabled = true;
            
            try {
                // Ensure API_CONFIG is available
                if (typeof API_CONFIG === 'undefined') {
                    throw new Error('API Configuration not loaded. Please reload the page.');
                }
                
                const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`;
                console.log('Register API URL:', apiUrl);
                console.log('Register payload:', { fullName, email, password, role });
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        password,
                        role
                    })
                });
                
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || data.errors?.[0]?.msg || 'Registration failed');
                }
                
                // Verify we have a success response
                if (!data.success) {
                    throw new Error(data.message || 'Registration was not successful');
                }
                
                // Store JWT token if returned (for auto-login)
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    console.log('Token stored:', data.token);
                }
                
                // Success - update UI
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Account Created!';
                submitBtn.style.background = '#22c55e';
                
                console.log('Registration successful, redirecting to login in 1.5 seconds...');
                
                setTimeout(() => {
                    try {
                        console.log('Redirecting to login page');
                        window.location.href = './login.html';
                    } catch (redirectError) {
                        console.error('Redirect error:', redirectError);
                        showError('Registration successful but could not redirect. Please navigate to login.');
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Registration error:', error);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                showError(error.message || 'Registration failed. Please try again.');
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