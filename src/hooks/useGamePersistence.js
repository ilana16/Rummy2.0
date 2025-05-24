import React, { useState, useEffect } from 'react';
import { getDatabase, ref, update, onValue, get } from 'firebase/database';
import { useAuth } from '../context/AuthContext';

const useGamePersistence = (gameId) => {
  const { currentUser } = useAuth();
  const [savedGames, setSavedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const database = getDatabase();

  // Load saved games for the current user
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    const savedGamesRef = ref(database, `users/${currentUser.uid}/savedGames`);
    
    const unsubscribe = onValue(savedGamesRef, (snapshot) => {
      try {
        const savedGamesData = snapshot.val();
        if (savedGamesData) {
          const gamesArray = Object.entries(savedGamesData).map(([id, game]) => ({
            id,
            ...game
          }));
          
          // Sort by last saved timestamp
          gamesArray.sort((a, b) => b.savedAt - a.savedAt);
          setSavedGames(gamesArray);
        } else {
          setSavedGames([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading saved games:", err);
        setError("Failed to load saved games");
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, database]);

  // Save current game state
  const saveGame = async (gameName = null) => {
    if (!gameId || !currentUser) return null;
    
    try {
      // Get current game state
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);
      const gameData = snapshot.val();
      
      if (!gameData) {
        setError("Game not found");
        return null;
      }
      
      // Create save data
      const saveData = {
        gameId,
        gameName: gameName || `Game ${new Date().toLocaleString()}`,
        gameState: gameData,
        savedAt: Date.now()
      };
      
      // Save to user's saved games
      const savedGameRef = ref(database, `users/${currentUser.uid}/savedGames/${gameId}`);
      await update(savedGameRef, saveData);
      
      return gameId;
    } catch (err) {
      console.error("Error saving game:", err);
      setError("Failed to save game");
      return null;
    }
  };

  // Load a saved game
  const loadGame = async (savedGameId) => {
    if (!currentUser) return null;
    
    try {
      // Get saved game data
      const savedGameRef = ref(database, `users/${currentUser.uid}/savedGames/${savedGameId}`);
      const snapshot = await get(savedGameRef);
      const savedGameData = snapshot.val();
      
      if (!savedGameData) {
        setError("Saved game not found");
        return null;
      }
      
      // Update the current game with saved state
      const gameRef = ref(database, `games/${savedGameData.gameId}`);
      await update(gameRef, {
        ...savedGameData.gameState,
        lastLoaded: Date.now()
      });
      
      return savedGameData.gameId;
    } catch (err) {
      console.error("Error loading saved game:", err);
      setError("Failed to load saved game");
      return null;
    }
  };

  // Auto-save game periodically
  const setupAutoSave = (interval = 60000) => {
    if (!gameId || !currentUser) return null;
    
    const intervalId = setInterval(() => {
      saveGame(`Auto-save ${new Date().toLocaleString()}`);
    }, interval);
    
    return () => clearInterval(intervalId);
  };

  return {
    savedGames,
    loading,
    error,
    saveGame,
    loadGame,
    setupAutoSave
  };
};

export default useGamePersistence;
