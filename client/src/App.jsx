import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import InterviewSetup from './pages/InterviewSetup'
import AIQuestionScreen from './pages/AIQuestionScreen'
import VoiceRecordingScreen from './pages/VoiceRecordingScreen'
import ResultsDashboard from './pages/ResultsDashboard'
import PerformanceAnalytics from './pages/PerformanceAnalytics'
import AdminPanel from './pages/AdminPanel'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Outlet />
          </div>
        </AuthProvider>
      ),
      children: [
        { path: 'login', element: <Login /> },
        { path: 'signup', element: <Signup /> },
        { path: '', element: <PrivateRoute><Dashboard /></PrivateRoute> },
        { path: 'resume-upload', element: <PrivateRoute><ResumeUpload /></PrivateRoute> },
        { path: 'interview-setup', element: <PrivateRoute><InterviewSetup /></PrivateRoute> },
        { path: 'interview/:id/question', element: <PrivateRoute><AIQuestionScreen /></PrivateRoute> },
        { path: 'interview/:id/recording', element: <PrivateRoute><VoiceRecordingScreen /></PrivateRoute> },
        { path: 'results/:id', element: <PrivateRoute><ResultsDashboard /></PrivateRoute> },
        { path: 'analytics', element: <PrivateRoute><PerformanceAnalytics /></PrivateRoute> },
        { path: 'admin', element: <PrivateRoute><AdminPanel /></PrivateRoute> },
        { path: '*', element: <Navigate to="/" replace /> }
      ]
    }
  ],
  {
    future: {
      v7_startTransition: true,
    }
  }
)

function App() {
  return <RouterProvider router={router} />
}

export default App
