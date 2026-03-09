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
                const response = await fetch('/api/auth/register', {
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
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }
                
                // Store JWT token if returned
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                
                // Success - redirect to login
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Account Created!';
                submitBtn.style.background = '#22c55e';
                
                setTimeout(() => {
                    window.location.href = './login.html';
                }, 1000);
                
            } catch (error) {
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