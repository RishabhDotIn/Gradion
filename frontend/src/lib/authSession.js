export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

/** Role from stored user, or from JWT payload if present */
export function getSessionRole() {
  const u = getStoredUser();
  if (u?.role === "teacher" || u?.role === "student") return u.role;
  const token = readToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role === "teacher" || payload.role === "student") return payload.role;
  } catch {
    /* ignore */
  }
  return null;
}

export function isAuthenticated() {
  return Boolean(readToken());
}
