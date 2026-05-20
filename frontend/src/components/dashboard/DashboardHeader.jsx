import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall, API_CONFIG } from "../../lib/apiConfig.js";

function DashboardHeader({ user }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [mailboxItems, setMailboxItems] = useState([]);
  const [mailboxLoading, setMailboxLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const mailboxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mailboxRef.current && !mailboxRef.current.contains(event.target)) {
        setShowMailbox(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const res = await apiCall(`${API_CONFIG.ENDPOINTS.MAILBOX}?limit=1`);
        setUnreadCount(res?.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const avatarUrl = user?.profileImage
    ? (user.profileImage.startsWith("http") ? user.profileImage : `${API_CONFIG.BASE_URL}${user.profileImage}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.fullName || "User")}&background=3B82F6&color=fff`;

  const openMailbox = async () => {
    setShowMailbox((prev) => !prev);
    if (showMailbox) return;

    setMailboxLoading(true);
    try {
      const res = await apiCall(`${API_CONFIG.ENDPOINTS.MAILBOX}?limit=8`);
      setMailboxItems(res?.notifications || []);
      setUnreadCount(res?.unreadCount || 0);
      if ((res?.unreadCount || 0) > 0) {
        await apiCall(API_CONFIG.ENDPOINTS.MAILBOX_READ, "PUT");
        setUnreadCount(0);
      }
    } catch {
      setMailboxItems([]);
    } finally {
      setMailboxLoading(false);
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-left"><h1 className="header-title">Dashboard</h1></div>
      <div className="header-right">
        <div className="header-search"><i className="fas fa-search" /><input type="text" placeholder="Search anything" /></div>
        <div className="header-mailbox" ref={mailboxRef}>
          <button className="header-icon-btn" type="button" onClick={openMailbox}>
            <i className="fas fa-envelope" />
            {unreadCount > 0 && <span className="mailbox-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {showMailbox && (
            <div className="mailbox-dropdown">
              <div className="mailbox-dropdown-title">Mailbox</div>
              {mailboxLoading ? (
                <div className="mailbox-empty">Loading messages...</div>
              ) : mailboxItems.length === 0 ? (
                <div className="mailbox-empty">No messages yet.</div>
              ) : (
                mailboxItems.map((item) => (
                  <div className="mailbox-item" key={item._id}>
                    <div className="mailbox-item-title">{item.title}</div>
                    <div className="mailbox-item-message">{item.message}</div>
                    <div className="mailbox-item-date">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button className="header-icon-btn" type="button"><i className="fas fa-bell" /></button>
        <div className="header-user" onClick={() => setShowDropdown(!showDropdown)} ref={dropdownRef}>
          <div className="header-avatar">
            <img id="userAvatar" src={avatarUrl} alt="Profile" />
          </div>
          <div className="header-user-info">
            <span className="header-user-name" id="userName">{user?.name || user?.fullName || (user?.email ? user.email.split("@")[0] : "Loading...")}</span>
            <span className="header-user-role" id="userRole">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
            </span>
          </div>
          <i className={`fas fa-chevron-down dropdown-arrow ${showDropdown ? "open" : ""}`} />

          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-item" onClick={() => navigate("/profile")}>
                <i className="fas fa-user-circle" />
                <span>My Profile</span>
              </div>
              <div className="dropdown-item" onClick={() => navigate("/profile")}>
                <i className="fas fa-cog" />
                <span>Settings</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
