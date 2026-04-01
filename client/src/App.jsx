import { createBrowserRouter, RouterProvider } from 'react-router-dom'
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
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/resume-upload" element={<PrivateRoute><ResumeUpload /></PrivateRoute>} />
              <Route path="/interview-setup" element={<PrivateRoute><InterviewSetup /></PrivateRoute>} />
              <Route path="/interview/:id/question" element={<PrivateRoute><AIQuestionScreen /></PrivateRoute>} />
              <Route path="/interview/:id/recording" element={<PrivateRoute><VoiceRecordingScreen /></PrivateRoute>} />
              <Route path="/results/:id" element={<PrivateRoute><ResultsDashboard /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><PerformanceAnalytics /></PrivateRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
            </Routes>
          </div>
        </AuthProvider>
      )
    }
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
)

function App() {
  return <RouterProvider router={router} />
}

export default App
