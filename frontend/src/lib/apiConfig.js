export const API_CONFIG = {
  BASE_URL: "http://localhost:5000",
  ENDPOINTS: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    VERIFY: "/api/auth/verify",
    ASSIGNMENTS: "/api/assignments",
    ASSIGNMENTS_PUBLIC: "/api/assignments/public",
    ASSIGNMENT_PUBLIC_BY_ID: "/api/assignments/public",
    ASSIGNMENTS_RECENT: "/api/assignments/recent",
  },
};

export async function apiCall(endpoint, method = "GET", data = null) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const token = localStorage.getItem("token");
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const responseData = await response.json();

  if (!response.ok) {
    const errorMsg = responseData.errors?.[0]?.msg || responseData.message || `API Error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return responseData;
}
