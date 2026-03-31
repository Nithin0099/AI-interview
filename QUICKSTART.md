# AI Interview Platform - Quick Start Guide

## Overview
This is a complete MERN stack AI interview platform with:
- **Frontend**: React with Tailwind CSS, Recharts, Axios, React Router
- **Backend**: Node.js with Express, MongoDB, JWT authentication

## Quick Setup

### 1. Backend Setup (Terminal 1)
```bash
cd server
npm install
# Create .env file with MongoDB URI and JWT_SECRET
npm run dev
# Server will run on http://localhost:5000
```

### 2. Frontend Setup (Terminal 2)
```bash
cd client
npm install
npm run dev
# Frontend will run on http://localhost:3000
```

## Project Features

### User Features
✅ Sign up and login with JWT authentication  
✅ Upload resume and job description  
✅ Configure interview difficulty (easy/medium/hard)  
✅ Answer AI-generated questions  
✅ Record voice responses  
✅ View detailed interview results  
✅ Track performance with analytics  
✅ View score progression and skill assessments  

### Admin Features
✅ Manage all users  
✅ Monitor all interviews  
✅ Delete users and interviews  
✅ View platform statistics  

## Interview Flow
1. Login → Dashboard
2. Click "Start Interview"
3. Upload resume + job details
4. Choose difficulty and duration
5. Answer generated questions
6. (Optional) Record voice responses
7. View results and analytics

## Key Endpoints

### Auth
- POST `/api/auth/signup`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Interviews
- GET `/api/interviews`
- POST `/api/interviews/create`
- GET `/api/interviews/:id`
- GET `/api/interviews/:id/question/:index`
- POST `/api/interviews/:id/answer`
- GET `/api/interviews/:id/results`

### Admin
- GET `/api/admin/users`
- GET `/api/admin/interviews`

### Analytics
- GET `/api/analytics/performance`

## Database Setup
MongoDB should be running locally or use MongoDB Atlas:
```
mongodb://localhost:27017/ai-interview
```

## Test Credentials
After signup, you can login with:
- Email: your-email@example.com
- Password: your-password

## Important Files

### Frontend
- `src/App.jsx` - Routes
- `src/context/AuthContext.jsx` - Auth state
- `src/services/api.js` - API calls
- `tailwind.config.js` - Tailwind config

### Backend
- `server.js` - Server entry point
- `routes/` - API routes
- `models/` - Database schemas
- `controllers/` - Route logic
- `middlewares/` - Auth and file upload

## Environment Variables

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interview
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Build for Production

### Frontend
```bash
cd client
npm run build
# Outputs to dist/
```

### Backend
Already ready for production, just update:
- NODE_ENV to "production"
- Use MongoDB Atlas URI
- Update JWT_SECRET
- Set proper CORS origins

## Deployment Ready
This project is ready to be deployed to:
- Frontend: Vercel, Netlify, AWS S3
- Backend: Heroku, Railway, AWS EC2, DigitalOcean

## Notes
- Mock question generation is included
- Answer scoring is randomized for demo
- Replace with real AI integration (OpenAI) for production
- Add real resume parsing library as needed
- Implement actual speech-to-text as needed

## Support
Check README.md files in `/server` and `/client` for detailed documentation.
