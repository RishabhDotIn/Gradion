import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import { apiCall, API_CONFIG } from "../lib/apiConfig.js";
import "../styles/profile.css";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ phoneNumber: "", collegeName: "", profileImage: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const persistUserWithImage = (profileImage) => {
    if (!profileImage) return;

    const localUserRaw = localStorage.getItem("user");
    if (localUserRaw) {
      const localUser = JSON.parse(localUserRaw);
      localStorage.setItem("user", JSON.stringify({ ...localUser, profileImage }));
    }

    const sessionUserRaw = sessionStorage.getItem("user");
    if (sessionUserRaw) {
      const sessionUser = JSON.parse(sessionUserRaw);
      sessionStorage.setItem("user", JSON.stringify({ ...sessionUser, profileImage }));
    }
  };

  const loadProfile = async () => {
    try {
      const res = await apiCall("/api/profile");
      if (res && res.data) {
        const mergedUser = {
          ...res.data.user,
          profileImage: res.data.profile?.profileImage || "",
        };
        setUser(mergedUser);
        setProfile({
          phoneNumber: res.data.profile?.phoneNumber || "",
          collegeName: res.data.profile?.collegeName || "",
          profileImage: res.data.profile?.profileImage || "",
        });

        persistUserWithImage(res.data.profile?.profileImage || "");
      }
    } catch (err) {
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await apiCall("/api/profile", "PUT", {
        phoneNumber: profile.phoneNumber,
        collegeName: profile.collegeName
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New passwords do not match!");
    }
    setUpdating(true);
    try {
      await apiCall("/api/profile/password", "PUT", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success("Password changed successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    try {
      toast.loading("Uploading image...", { id: 'upload-toast' });
      // We use fetch directly here since apiCall stringifies body by default
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/profile/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setProfile(prev => ({ ...prev, profileImage: data.data.profileImage }));
      setUser((prev) => (prev ? { ...prev, profileImage: data.data.profileImage } : prev));
      persistUserWithImage(data.data.profileImage);

      toast.success("Profile picture updated!", { id: 'upload-toast' });
    } catch (err) {
      toast.error(err.message || "Failed to upload image", { id: 'upload-toast' });
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;

  const imageUrl = profile.profileImage
    ? (profile.profileImage.startsWith("http") ? profile.profileImage : `${API_CONFIG.BASE_URL}${profile.profileImage}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=6366f1&color=fff&size=150`;

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content profile-container">
          
          <div className="profile-page-header">
            <h1>My Profile</h1>
            <p>Manage your personal information and security settings</p>
          </div>

          <div className="profile-grid">
            {/* Left Column: Image and Basic Info */}
            <div className="profile-card-glass profile-image-section">
              <div className="profile-image-wrapper" onClick={() => setShowUploadModal(true)} style={{ cursor: 'pointer' }}>
                <img src={imageUrl} alt="Profile" className="profile-image" />
                <div className="profile-image-overlay">
                  <i className="fas fa-camera"></i>
                </div>
              </div>
              <h2 className="profile-name">{user?.fullName}</h2>
              <span className="profile-role">{user?.role}</span>
              <p style={{ color: '#64748b', fontSize: '14px' }}><i className="fas fa-envelope" style={{ marginRight: '8px' }}></i>{user?.email}</p>
            </div>

            {/* Right Column: Forms */}
            <div>
              {/* Additional Details Form */}
              <div className="profile-card-glass" style={{ marginBottom: '24px' }}>
                <h3 className="profile-section-title">Personal Details</h3>
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" className="form-input" value={user?.fullName || ""} disabled />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" className="form-input" value={user?.email || ""} disabled />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter phone number"
                        value={profile.phoneNumber}
                        onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>College / University</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter college name"
                        value={profile.collegeName}
                        onChange={(e) => setProfile({...profile, collegeName: e.target.value})}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-glass" disabled={updating}>
                    {updating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Security Form */}
              <div className="profile-card-glass security-section">
                <h3 className="profile-section-title">Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showPassword.current ? "text" : "password"} 
                        className="form-input" 
                        required
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                      />
                      <i 
                        className={`fas ${showPassword.current ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`}
                        onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                      ></i>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>New Password</label>
                      <div className="password-input-wrapper">
                        <input 
                          type={showPassword.new ? "text" : "password"} 
                          className="form-input" 
                          required
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        />
                        <i 
                          className={`fas ${showPassword.new ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`}
                          onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                        ></i>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <div className="password-input-wrapper">
                        <input 
                          type={showPassword.confirm ? "text" : "password"} 
                          className="form-input" 
                          required
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        />
                        <i 
                          className={`fas ${showPassword.confirm ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`}
                          onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                        ></i>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-glass" disabled={updating}>
                    {updating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-lock"></i>}
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Image Upload Modal */}
      {showUploadModal && (
        <div className="profile-upload-modal-overlay">
          <div className="profile-upload-modal">
            <div className="modal-header">
              <h3>Update Profile Picture</h3>
              <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="upload-instructions">
                <i className="fas fa-cloud-upload-alt upload-icon-large"></i>
                <p>Select a new profile image to upload.</p>
                <span className="upload-limits">
                  <i className="fas fa-info-circle"></i> Max size: 5MB. Formats: JPG, PNG, WEBP.
                </span>
              </div>
              <button className="btn-primary-glass upload-trigger-btn" onClick={() => fileInputRef.current?.click()}>
                <i className="fas fa-folder-open"></i> Choose Image
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  handleImageUpload(e);
                  setShowUploadModal(false);
                }} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
