import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import { Provider as ReduxProvider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from './hooks/ThemeContext';
import store, { persistor } from './store';
import { logoutUser } from './store/authSlice';
import MitplanSelection from './components/MitplanSelection';
import Mitplan from './components/Mitplan';
import LoginButton from './components/LoginButton';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleLogout = () => {
      if (location.pathname === '/logout') {
        dispatch(logoutUser());
        navigate('/');
      }
    };

    handleLogout();
  }, [dispatch, navigate, location]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">Mitplan</Link>
          <LoginButton />
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<MitplanSelection />} />
          <Route path="/mitplan/:mitplanId" element={<Mitplan />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/logout" element={null} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

export default App;