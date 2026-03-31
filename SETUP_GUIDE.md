# 🎯 AI Interview Platform - Complete Setup Guide

## Project Overview
A full-stack MERN application for AI-powered interview preparation with:
- **8 User Pages** (Login, Signup, Dashboard, Resume Upload, Interview Setup, AI Questions, Voice Recording, Results, Analytics)
- **Admin Panel** for managing users and interviews
- **Real-time Analytics** with score tracking and skill assessment
- **JWT Authentication** with secure password hashing

---

## 📁 Project Structure

```
newproject/
│
├── 📂 client/                      # React Frontend (Port 3000)
│   ├── src/
│   │   ├── pages/                 # 8 page components
│   │   ├── components/            # Navbar, PrivateRoute
│   │   ├── services/              # API integration (api.js)
│   │   ├── context/               # Auth state management
│   │   ├── App.jsx               # Router setup
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── .env.example
│
├── 📂 server/                      # Express Backend (Port 5000)
│   ├── models/                    # 4 Mongoose schemas
│   │   ├── User.js
│   │   ├── Interview.js
│   │   ├── Question.js
│   │   └── Feedback.js
│   ├── routes/                    # 4 API route files
│   │   ├── auth.js
│   │   ├── interviews.js
│   │   ├── admin.js
│   │   └── analytics.js
│   ├── controllers/               # 4 controller files
│   │   ├── authController.js
│   │   ├── interviewController.js
│   │   ├── adminController.js
│   │   └── analyticsController.js
│   ├── middlewares/               # Auth & file upload
│   │   ├── auth.js
│   │   └── upload.js
│   ├── utils/                     # Helper functions
│   │   └── helpers.js
│   ├── server.js                  # Main server file
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── 📄 README.md                    # Main documentation
├── 📄 QUICKSTART.md                # Quick reference
├── 📄 package.json                 # Root package.json
├── 📄 .gitignore                   # Git ignore file
├── 🔧 install.bat                  # Windows installer
└── 🔧 install.sh                   # Linux/Mac installer

```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
bash install.sh
```

**Manual:**
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Step 2: Setup Environment Variables

**Server** (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interview
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
OPENAI_API_KEY=optional_openai_key
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Setup MongoDB
```bash
# Local installation (if you have MongoDB)
mongod

# OR use MongoDB Atlas (cloud):
# Update MONGODB_URI in server/.env with your Atlas connection string
```

### Step 4: Start Development Servers

**Option A - Run both servers together:**
```bash
npm run dev
# Runs: Server on 5000 + Client on 3000
```

**Option B - Run separately:**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### Step 5: Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

---

## 📝 Creating Test Account

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
4. Click "Sign Up"
5. You'll be redirected to Dashboard

---

## 🎯 Features by Page

### 1. **Login Page** (`/login`)
- Email and password input
- Error handling
- Link to signup
- JWT token storage

### 2. **Signup Page** (`/signup`)
- Name, email, password fields
- Password confirmation
- Account creation with hashed password
- Auto-login after signup

### 3. **Dashboard** (`/`)
- Overview cards (Total, Completed, In Progress)
- List of all interviews
- View Results button for completed interviews
- Start Interview button

### 4. **Resume Upload** (`/resume-upload`)
- File upload for resume (PDF, DOC, DOCX)
- Job title input
- Job description textarea
- Validation before submit

### 5. **Interview Setup** (`/interview-setup`)
- Display job details
- Difficulty level selector (easy/medium/hard)
- Duration selector (15/30/45/60 min)
- Pre-interview checklist
- Start Interview button

### 6. **AI Question Screen** (`/interview/:id/question`)
- Display AI-generated questions
- Timer (5 min per question)
- Answer textarea
- Hint display
- Next Question button
- Auto-advance on timer

### 7. **Voice Recording** (`/interview/:id/recording`)
- Start/Stop recording buttons
- Audio preview
- Re-record option
- Submit button

### 8. **Results Dashboard** (`/results/:id`)
- Overall score display
- Questions answered count
- Detailed feedback for each question
- Score visualization
- Download report button
- Back to dashboard button

### 9. **Performance Analytics** (`/analytics`)
- Average score card
- Total interviews card
- Improvement rate card
- Best score card
- Score progression line chart
- Skills assessment bar chart
- Personalized recommendations

### 10. **Admin Panel** (`/admin`)
- User management tab
  - View all users
  - Delete users
  - See user details
- Interview management tab
  - View all interviews
  - Delete interviews
  - See scores and status

---

## 🔑 API Endpoints Reference

### Authentication
```
POST   /api/auth/signup          # Create account
POST   /api/auth/login           # Login
GET    /api/auth/me              # Get current user
```

### Interviews
```
GET    /api/interviews            # Get user's interviews
POST   /api/interviews/create     # Create new interview
GET    /api/interviews/:id        # Get interview details
PUT    /api/interviews/:id        # Update interview settings
GET    /api/interviews/:id/question/:index   # Get specific question
POST   /api/interviews/:id/answer # Submit answer
POST   /api/interviews/:id/submit-audio      # Submit voice
GET    /api/interviews/:id/results           # Get results
```

### Admin
```
GET    /api/admin/users           # Get all users
DELETE /api/admin/users/:id       # Delete user
GET    /api/admin/interviews      # Get all interviews
DELETE /api/admin/interviews/:id  # Delete interview
GET    /api/admin/stats           # Get dashboard stats
```

### Analytics
```
GET    /api/analytics/performance # Get user performance
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI Framework | 18.2.0 |
| Vite | Build Tool | 5.0.0 |
| React Router | Navigation | 6.20.0 |
| Tailwind CSS | Styling | 3.3.0 |
| Axios | HTTP Client | 1.6.0 |
| Recharts | Charts | 2.10.0 |
| Chart.js | Charts | 4.4.0 |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js | Runtime | v14+ |
| Express | Framework | 4.18.2 |
| MongoDB | Database | Latest |
| Mongoose | ODM | 8.0.0 |
| JWT | Authentication | 9.1.0 |
| bcryptjs | Hashing | 2.4.3 |
| Multer | File Upload | 1.4.5 |
| CORS | Cross-Origin | 2.8.5 |

---

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  createdAt: Date
}
```

### Interview Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  jobTitle: String,
  jobDescription: String,
  resumePath: String,
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  duration: Number,
  status: String (enum: ['not_started', 'in_progress', 'completed']),
  questions: Array,
  answers: Array,
  score: Number,
  startedAt: Date,
  completedAt: Date,
  createdAt: Date
}
```

---

## 🔐 Security Features

✅ **Password Hashing**: bcryptjs with 10 salt rounds  
✅ **JWT Authentication**: Tokens with 7-day expiration  
✅ **Protected Routes**: Frontend route guards  
✅ **Protected API**: Auth middleware on all protected endpoints  
✅ **File Upload Validation**: Type and size checking  
✅ **CORS Enabled**: Restricted to frontend origin  
✅ **Error Handling**: Comprehensive error messages (but secure)  

---

## 🚀 Production Deployment

### Backend Deployment (Heroku/Railway/AWS)
```bash
# Update .env
NODE_ENV=production
MONGODB_URI=your_atlas_uri
JWT_SECRET=strong_random_key_here

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Build
npm run build

# Deploy dist/ folder
# Update VITE_API_URL to your backend URL
```

---

## 🔗 Useful Commands

```bash
# Development
npm run dev              # Run both servers
npm run server          # Run backend only
npm run client          # Run frontend only

# Production
npm run build           # Build frontend
npm start              # Run backend

# Installation
npm run install-all    # Install all dependencies

# Monitoring
curl http://localhost:5000/health     # Check backend
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ MongoServerError: connect ECONNREFUSED
✅ Solution: Start MongoDB locally (mongod) or update connection string to MongoDB Atlas
```

### CORS Error
```
❌ Access to XMLHttpRequest blocked by CORS
✅ Solution: Ensure backend CORS is configured and API URL in .env is correct
```

### Port Already in Use
```
❌ Error: listen EADDRINUSE: address already in use :::5000
✅ Solution: Change PORT in .env or kill process using port
# Windows: netstat -ano | findstr :5000
# Linux: lsof -i :5000
```

### Module Not Found
```
❌ Cannot find module 'xyz'
✅ Solution: Run npm install && cd server && npm install && cd ../client && npm install
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)

---

## 📄 License & Support

This project is open-source and ready for modification.

For questions or issues:
1. Check the README.md files in each folder
2. Review QUICKSTART.md for common issues
3. Check documentation in each file

---

## ✨ Next Steps After Setup

1. ✅ Install all dependencies
2. ✅ Configure .env files
3. ✅ Start MongoDB
4. ✅ Run development servers
5. 📝 Create test account
6. 🧪 Test the interview flow
7. 🔌 (Optional) Integrate real AI APIs
8. 📦 (Optional) Deploy to production

---

**Happy Coding! 🚀**
