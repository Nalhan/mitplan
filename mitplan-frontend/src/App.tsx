import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoomSelection from './components/RoomSelection';
import Room from './components/Room';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Provider as ReduxProvider } from 'react-redux';
import { initializeSocket } from './store/socketService';
import store from './store';

const AppContent: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();  

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-gray-900 text-black dark:text-white">
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white z-10"
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
      <div className="h-full overflow-auto">
        <Routes>
          <Route path="/" element={<RoomSelection />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </ReduxProvider>
  );
};

export default App;