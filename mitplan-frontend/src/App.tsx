import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from './hooks/ThemeContext';
import store from './store';
import MitplanSelection from './components/MitplanSelection';
import Mitplan from './components/Mitplan';
import LoginButton from './components/LoginButton';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mitplan</h1>
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
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </ReduxProvider>
  );
};

export default App;