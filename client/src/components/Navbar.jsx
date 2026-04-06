import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600">
            AI Interview
          </Link>

          {user && (
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-gray-700 text-sm sm:text-base">{user.name || user.email}</span>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm sm:text-base"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
