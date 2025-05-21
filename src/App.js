import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Import pages
import Login from './pages/Login';
import ScreenNameInput from './pages/ScreenNameInput';
import GameLobby from './pages/GameLobby';
import GameRoom from './pages/GameRoom';
import Profile from './pages/Profile';

// Import context
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Screen name required route
const ScreenNameRequiredRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  // If user is authenticated but doesn't have a display name, redirect to screen name input
  if (!currentUser.displayName) {
    return <Navigate to="/set-name" />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/set-name" 
          element={
            <ProtectedRoute>
              <ScreenNameInput />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lobby" 
          element={
            <ScreenNameRequiredRoute>
              <GameLobby />
            </ScreenNameRequiredRoute>
          } 
        />
        <Route 
          path="/game/:gameId" 
          element={
            <ScreenNameRequiredRoute>
              <GameRoom />
            </ScreenNameRequiredRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ScreenNameRequiredRoute>
              <Profile />
            </ScreenNameRequiredRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
