export const API_CONFIG = {
  BASE_URL: "http://localhost:5000",
  ENDPOINTS: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH_TOKEN: "/api/auth/refresh",
    VERIFY: "/api/auth/verify",
    ASSIGNMENTS: "/api/assignments",
    ASSIGNMENTS_RECENT: "/api/assignments/recent",
    TEACHER_ASSIGNMENTS: "/api/assignments/teacher",
    TEACHER_RECENT: "/api/assignments/teacher/recent",
    TEACHER_PERFORMANCE: "/api/assignments/teacher/performance",
    DASHBOARD_STATS: "/api/dashboard/stats",
    PERFORMANCE: "/api/performance",
    HEALTH: "/api/health",
  },
};

// Sanitize input data to prevent XSS
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

// Get token from sessionStorage (more secure than localStorage)
const getToken = () => {
  return sessionStorage.getItem('token');
};

// Clear session data
const clearSession = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

export async function apiCall(endpoint, method = "GET", data = null) {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include'
    };

    const token = getToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(sanitizeData(data));
    }

    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized - clear session and redirect
    if (response.status === 401) {
      clearSession();
      window.location.href = '/login';
      return;
    }

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData.errors?.[0]?.msg || responseData.message || `API Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    return responseData;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

export { getToken, clearSession, sanitizeData };
