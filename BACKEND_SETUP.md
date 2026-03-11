# Gradion Frontend-Backend Integration Setup

## ✅ Completed Tasks:

### 1. Frontend Configuration (`Public/Js/config.js`)
- Created centralized API configuration file
- Configured base URL: `http://localhost:5000`
- Defined API endpoints for Register, Login, and Token Verification

### 2. Updated Login System (`Public/login.html` & `Public/Js/login.js`)
- Removed old localStorage-based Backend.js
- Updated to use real backend API at `/api/auth/login`
- Stores JWT token from MongoDB-backed authentication
- Redirects based on user role (student/teacher)

### 3. Updated Registration System (`Public/register.html` & `Public/Js/register.js`)
- Removed old localStorage-based Backend.js
- Updated to use real backend API at `/api/auth/register`
- Sends data to MongoDB for persistent storage
- Receives JWT token on successful registration

### 4. Backend Server Setup
- Express.js API server running on port 5000
- MongoDB connection configured
- JWT authentication implemented
- User model with bcrypt password hashing
- Role-based middleware for protected routes

## ⚠️ Current Issue: MongoDB Connection

The backend is configured but hitting a MongoDB Atlas connectivity issue:

```
MongoDB connection error: Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## 🔧 How to Fix MongoDB Connection:

### Option 1: Whitelist Your IP in MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click on your **Cluster0** project
3. Go to **Network Access** → **IP Whitelist**
4. Click **Add IP Address**
5. Either:
   - Add your current machine's public IP (find it: `curl ifconfig.me`)
   - Or add `0.0.0.0/0` to allow all IPs (NOT recommended for production)
6. Click **Confirm**

### Option 2: Use MongoDB Atlas Credentials in Connection String

Ensure `.env` file has:
```
MONGODB_URI=mongodb+srv://gradion:gradion123@cluster0.4ze3qmw.mongodb.net/?appName=Cluster0
```

This connection string is already in your `.env` file.

## 📋 API Endpoints Available:

Once MongoDB is connected, your frontend will be able to use:

1. **Register User**
   - Endpoint: `POST /api/auth/register`
   - Body: `{ fullName, email, password, role }`
   - Returns: `{ token, user }`

2. **Login User**
   - Endpoint: `POST /api/auth/login`
   - Body: `{ email, password, rememberMe }`
   - Returns: `{ token, user }`

3. **Verify Token**
   - Endpoint: `GET /api/auth/verify`
   - Headers: `Authorization: Bearer {token}`
   - Returns: `{ user }`

## 🌐 Frontend to Backend Flow:

```
User opens login.html
    ↓
User enters credentials
    ↓
login.js calls → http://localhost:5000/api/auth/login
    ↓
Backend validates against MongoDB
    ↓
Returns JWT token
    ↓
localStorage stores token
    ↓
Redirects to dashboard
```

## 🚀 Testing the System:

1. **Whitelist your IP** in MongoDB Atlas (see above)
2. **Start backend**: `cd backend && node server.js`
3. **Check health**: `curl http://localhost:5000/api/health`
4. **Open frontend**: Open `Public/login.html` in your browser
5. **Test registration**: Create a new account
6. **Test login**: Login with created account

## 📱 Frontend Files Modified:

- ✅ `Public/login.html` - Removed Backend.js, added config.js
- ✅ `Public/register.html` - Removed Backend.js, added config.js
- ✅ `Public/Js/login.js` - Updated to use real API URLs
- ✅ `Public/Js/register.js` - Updated to use real API URLs
- ✅ `Public/Js/config.js` - NEW: API configuration file

## 🔐 Security Notes:

- Passwords are hashed using bcryptjs (12 salt rounds)
- JWT tokens expire in 30 days (90 days if "remember me" is checked)
- Tokens are stored in localStorage (consider using httpOnly cookies in production)
- Backend validates all inputs before saving to MongoDB

## 📝 Next Steps:

1. **Fix MongoDB IP Whitelist** - This is the blocking issue
2. Test registration and login in the browser
3. Verify user data is being saved to MongoDB
4. Test JWT token validation
5. Test role-based redirects (teacher vs student dashboards)