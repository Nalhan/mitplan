import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { logoutUser } from '../store/authSlice';

const LoginButton: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/discord`;
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center">
        <img src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`} alt="User Avatar" className="w-8 h-8 rounded-full mr-2" />
        <span className="mr-2">{user.username}</span>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
      Login with Discord
    </button>
  );
};

export default LoginButton;
