import React from 'react';
import ReactDOM from 'react-dom';
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
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/lobby" element={<GameLobby />} />
          <Route path="/game/:gameId" element={<GameRoom />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
