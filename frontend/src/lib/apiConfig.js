/**
 * API base URL:
 * - Set VITE_API_BASE_URL in frontend/.env (e.g. http://localhost:5000) to call the backend directly.
 * - If unset in development, uses "" so requests go to the Vite dev server and the /api proxy (see vite.config.js).
 * - Production builds without VITE_API_BASE_URL fall back to http://localhost:5000 (adjust for your deploy).
 */
const envBase = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

const resolvedBase =
  envBase ||
  (import.meta.env.DEV ? "" : "http://localhost:5000");

export const API_CONFIG = {
  BASE_URL: resolvedBase,
  ENDPOINTS: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH_TOKEN: "/api/auth/refresh",
    VERIFY: "/api/auth/verify",
    ASSIGNMENTS: "/api/assignments/teacher",
    ASSIGNMENTS_TEACHER: "/api/assignments/teacher",
    ASSIGNMENTS_STUDENT: "/api/assignments/student",
    ASSIGNMENTS_PUBLIC: "/api/assignments/public",
    ASSIGNMENT_PUBLIC_BY_ID: "/api/assignments/public",
    ASSIGNMENTS_RECENT: "/api/assignments/recent",
    AI_ASSIGNMENT_QUESTIONS: "/api/ai/assignment-questions",
    TEACHER_ASSIGNMENTS: "/api/assignments/teacher",
    TEACHER_RECENT: "/api/assignments/teacher/recent",
    TEACHER_PERFORMANCE: "/api/assignments/teacher/performance",
    DASHBOARD_STATS: "/api/dashboard/stats",
    DASHBOARD_TEACHER: "/api/dashboard/teacher",
    DASHBOARD_STUDENT: "/api/dashboard/student",
    CLASSES: "/api/classes",
    CLASSES_TEACHER: "/api/classes/teacher",
    CLASSES_STUDENT: "/api/classes/student",
    CLASSES_JOIN: "/api/classes/join",
    SUBMISSIONS: "/api/submissions",
    SUBMISSIONS_RUN: "/api/submissions/run",
    MAILBOX: "/api/mailbox",
    MAILBOX_READ: "/api/mailbox/read",
    PERFORMANCE: "/api/performance",
    HEALTH: "/api/health",
  },
};

// Sanitize input data to prevent XSS (preserve arrays — object spread from for-in breaks JSON arrays)
const sanitizeData = (data) => {
  if (typeof data === "string") {
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }
  if (typeof data === "object" && data !== null) {
    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

const getToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

const clearSession = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export async function apiCall(endpoint, method = "GET", data = null) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = API_CONFIG.BASE_URL;
  const url = `${base}${path}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  const token = getToken();
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(sanitizeData(data));
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    const hint =
      import.meta.env.DEV && !base
        ? " (is the backend running on port 5000? Vite proxies /api to it.)"
        : base
          ? ` (check VITE_API_BASE_URL: ${base})`
          : "";
    throw new Error(`${err?.message || "Network error"}${hint}`);
  }

  if (response.status === 401) {
    clearSession();
    window.location.href = "/login";
    return;
  }

  let responseData;
  const ct = response.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text?.slice(0, 200) || response.statusText };
    }
  } catch {
    responseData = { message: `Invalid response (${response.status})` };
  }

  if (!response.ok) {
    const errorMsg =
      responseData.errors?.[0]?.msg || responseData.message || `API Error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return responseData;
}

export { getToken, clearSession, sanitizeData };
