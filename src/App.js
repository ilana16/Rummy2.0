import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Import pages
import Login from './pages/Login';
import GameLobby from './pages/GameLobby';
import GameRoom from './pages/GameRoom';
import Profile from './pages/Profile';

// Import context
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lobby" element={<GameLobby />} />
        <Route path="/game/:gameId" element={<GameRoom />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
