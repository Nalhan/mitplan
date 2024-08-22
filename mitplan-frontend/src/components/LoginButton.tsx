import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';
import { logoutUser, setUser } from '../store/authSlice';

const LoginButton: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!isAuthenticated) {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user`, {
            credentials: 'include'
          });
          if (response.ok) {
            const userData = await response.json();
            dispatch(setUser(userData));
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
        }
      }
    };

    checkAuthStatus();
  }, [dispatch, isAuthenticated]);

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/discord`;
  };

  const handleLogout = () => {
    // Redirect to the server-side logout page
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/logout`;
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="flex items-center space-x-2 group">
          <img 
            src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`} 
            alt="User Avatar" 
            className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 transition-colors duration-200 group-hover:border-blue-500"
          />
          <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-200 group-hover:text-blue-500">{user.username}</span>
        </Link>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin} 
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      Login with Discord
    </button>
  );
};

export default LoginButton;