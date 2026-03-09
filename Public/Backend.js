// ============================================
// GRADION - Backend Simulation (localStorage)
// ============================================
// This file simulates backend API endpoints using localStorage
// for testing authentication flow without a real server.

(function() {
    'use strict';

    // Initialize localStorage database if not exists
    function initDatabase() {
        if (!localStorage.getItem('gradion_users')) {
            localStorage.setItem('gradion_users', JSON.stringify([]));
        }
        if (!localStorage.getItem('gradion_sessions')) {
            localStorage.setItem('gradion_sessions', JSON.stringify({}));
        }
    }

    // Generate a simple JWT-like token
    function generateToken(user) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            iat: Date.now(),
            exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        }));
        const signature = btoa(Math.random().toString(36).substring(2));
        return `${header}.${payload}.${signature}`;
    }

    // Generate unique ID
    function generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    // Get all users
    function getUsers() {
        return JSON.parse(localStorage.getItem('gradion_users') || '[]');
    }

    // Save users
    function saveUsers(users) {
        localStorage.setItem('gradion_users', JSON.stringify(users));
    }

    // Hash password (simple simulation)
    function hashPassword(password) {
        return btoa(password + '_gradion_salt');
    }

    // Verify password
    function verifyPassword(password, hashedPassword) {
        return hashPassword(password) === hashedPassword;
    }

    // ============================================
    // API ENDPOINTS SIMULATION
    // ============================================

    // Register API
    async function register(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const { fullName, email, password, role } = data;

                    // Validation
                    if (!fullName || !email || !password || !role) {
                        return reject({ message: 'All fields are required' });
                    }

                    if (!email.includes('@')) {
                        return reject({ message: 'Invalid email format' });
                    }

                    if (password.length < 6) {
                        return reject({ message: 'Password must be at least 6 characters' });
                    }

                    if (!['student', 'teacher'].includes(role)) {
                        return reject({ message: 'Invalid role selected' });
                    }

                    // Check if user already exists
                    const users = getUsers();
                    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                    
                    if (existingUser) {
                        return reject({ message: 'Email already registered' });
                    }

                    // Create new user
                    const newUser = {
                        id: generateId(),
                        fullName,
                        email: email.toLowerCase(),
                        password: hashPassword(password),
                        role,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    // Save user
                    users.push(newUser);
                    saveUsers(users);

                    // Generate token
                    const token = generateToken(newUser);

                    // Return success response (without password)
                    const { password: _, ...userWithoutPassword } = newUser;
                    
                    resolve({
                        success: true,
                        message: 'Registration successful',
                        token,
                        user: userWithoutPassword
                    });

                } catch (error) {
                    reject({ message: 'Registration failed. Please try again.' });
                }
            }, 800); // Simulate network delay
        });
    }

    // Login API
    async function login(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const { email, password, rememberMe } = data;

                    // Validation
                    if (!email || !password) {
                        return reject({ message: 'Email and password are required' });
                    }

                    // Find user
                    const users = getUsers();
                    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

                    if (!user) {
                        return reject({ message: 'Invalid email or password' });
                    }

                    // Verify password
                    if (!verifyPassword(password, user.password)) {
                        return reject({ message: 'Invalid email or password' });
                    }

                    // Generate token
                    const token = generateToken(user);

                    // Store session
                    const sessions = JSON.parse(localStorage.getItem('gradion_sessions') || '{}');
                    sessions[user.id] = {
                        token,
                        rememberMe,
                        loginAt: new Date().toISOString()
                    };
                    localStorage.setItem('gradion_sessions', JSON.stringify(sessions));

                    // Return success response (without password)
                    const { password: _, ...userWithoutPassword } = user;

                    resolve({
                        success: true,
                        message: 'Login successful',
                        token,
                        user: userWithoutPassword
                    });

                } catch (error) {
                    reject({ message: 'Login failed. Please try again.' });
                }
            }, 800); // Simulate network delay
        });
    }

    // Verify Token API
    async function verifyToken(token) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    if (!token) {
                        return reject({ message: 'No token provided' });
                    }

                    // Decode token
                    const parts = token.split('.');
                    if (parts.length !== 3) {
                        return reject({ message: 'Invalid token format' });
                    }

                    const payload = JSON.parse(atob(parts[1]));

                    // Check expiration
                    if (payload.exp < Date.now()) {
                        return reject({ message: 'Token expired' });
                    }

                    // Find user
                    const users = getUsers();
                    const user = users.find(u => u.id === payload.userId);

                    if (!user) {
                        return reject({ message: 'User not found' });
                    }

                    // Return user (without password)
                    const { password: _, ...userWithoutPassword } = user;

                    resolve({
                        success: true,
                        user: userWithoutPassword
                    });

                } catch (error) {
                    reject({ message: 'Invalid token' });
                }
            }, 300);
        });
    }

    // Logout API
    async function logout() {
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                resolve({ success: true, message: 'Logged out successfully' });
            }, 300);
        });
    }

    // Get Current User
    async function getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) {
            return null;
        }
        try {
            const result = await verifyToken(token);
            return result.user;
        } catch {
            return null;
        }
    }

    // ============================================
    // INTERCEPT FETCH REQUESTS
    // ============================================

    const originalFetch = window.fetch;

    window.fetch = async function(url, options = {}) {
        // Only intercept our API endpoints
        if (typeof url === 'string' && url.startsWith('/api/')) {
            const method = (options.method || 'GET').toUpperCase();
            const body = options.body ? JSON.parse(options.body) : {};

            // Route handling
            try {
                let result;

                if (url === '/api/auth/register' && method === 'POST') {
                    result = await register(body);
                } else if (url === '/api/auth/login' && method === 'POST') {
                    result = await login(body);
                } else if (url === '/api/auth/verify' && method === 'GET') {
                    const token = options.headers?.Authorization?.replace('Bearer ', '');
                    result = await verifyToken(token);
                } else if (url === '/api/auth/logout' && method === 'POST') {
                    result = await logout();
                } else if (url === '/api/auth/me' && method === 'GET') {
                    const token = options.headers?.Authorization?.replace('Bearer ', '') || localStorage.getItem('token');
                    result = await verifyToken(token);
                } else {
                    // Unknown endpoint
                    return new Response(JSON.stringify({ message: 'Endpoint not found' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Success response
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                // Error response
                return new Response(JSON.stringify(error), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // For non-API requests, use original fetch
        return originalFetch.apply(this, arguments);
    };

    // ============================================
    // UTILITY FUNCTIONS (Global)
    // ============================================

    window.GradionAuth = {
        register,
        login,
        logout,
        verifyToken,
        getCurrentUser,
        getUsers: () => {
            const users = getUsers();
            return users.map(({ password, ...user }) => user);
        },
        clearAllData: () => {
            localStorage.removeItem('gradion_users');
            localStorage.removeItem('gradion_sessions');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            initDatabase();
            console.log('All Gradion data cleared');
        },
        isAuthenticated: () => {
            return !!localStorage.getItem('token');
        }
    };

    // Initialize
    initDatabase();

    console.log('%c✓ Gradion Backend Simulation Loaded', 'color: #22c55e; font-weight: bold;');
    console.log('%cAPI Endpoints Available:', 'color: #3B82F6; font-weight: bold;');
    console.log('  POST /api/auth/register');
    console.log('  POST /api/auth/login');
    console.log('  POST /api/auth/logout');
    console.log('  GET  /api/auth/verify');
    console.log('  GET  /api/auth/me');
    console.log('%cUtility: window.GradionAuth', 'color: #3B82F6; font-weight: bold;');

})(); 