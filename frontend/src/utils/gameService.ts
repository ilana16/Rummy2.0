import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { app } from '../firebase';
import { getAuth } from 'firebase/auth';
import { createNewTileDeck, dealTiles } from '../utils/gameLogic';

const db = getFirestore(app);
const auth = getAuth(app);

// Generate a random game code
const generateGameCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Check if a game code already exists
const checkGameCodeExists = async (code: string) => {
  const gameRef = doc(db, 'games', code);
  const gameSnap = await getDoc(gameRef);
  return gameSnap.exists();
};

// Generate a unique game code
const generateUniqueGameCode = async () => {
  let code = generateGameCode();
  let exists = await checkGameCodeExists(code);
  
  while (exists) {
    code = generateGameCode();
    exists = await checkGameCodeExists(code);
  }
  
  return code;
};

const createGame = async (hostId: string, hostName: string, isPrivate: boolean, customCode?: string) => {
  let gameCode;
  
  if (isPrivate && customCode && customCode.length >= 4) {
    // Check if custom code is available
    const exists = await checkGameCodeExists(customCode);
    if (exists) {
      throw new Error('Game code already in use. Please try another code.');
    }
    gameCode = customCode.toUpperCase();
  } else {
    gameCode = await generateUniqueGameCode();
  }
  
  const gameRef = doc(db, 'games', gameCode);
  
  // Create initial game state
  const gameData = {
    gameCode,
    host: hostId,
    status: 'waiting',
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
    players: [{
      id: hostId,
      name: hostName,
      isConnected: true,
      isReady: false,
      isBot: false
    }],
    settings: {
      maxPlayers: 4,
      withBots: false
    },
    currentTurn: 0,
    board: [],
    pool: [],
    winner: null
  };
  
  await setDoc(gameRef, gameData);
  
  return gameCode;
};

const joinGame = async (gameCode: string, userId: string, userName: string) => {
  const gameRef = doc(db, 'games', gameCode);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) {
    throw new Error('Game not found. Please check the code and try again.');
  }
  
  const gameData = gameSnap.data();
  
  if (gameData.status !== 'waiting') {
    throw new Error('Game has already started or ended.');
  }
  
  if (gameData.players.length >= gameData.settings.maxPlayers) {
    throw new Error('Game is full. Please join another game.');
  }
  
  // Check if player is already in the game
  const existingPlayer = gameData.players.find((p: any) => p.id === userId);
  
  if (existingPlayer) {
    // Update player connection status
    await updateDoc(gameRef, {
      players: gameData.players.map((p: any) => 
        p.id === userId ? { ...p, isConnected: true } : p
      ),
      lastUpdatedAt: new Date()
    });
  } else {
    // Add new player
    await updateDoc(gameRef, {
      players: arrayUnion({
        id: userId,
        name: userName,
        isConnected: true,
        isReady: false,
        isBot: false
      }),
      lastUpdatedAt: new Date()
    });
  }
  
  return gameCode;
};

const addBot = async (gameCode: string, difficulty: 'easy' | 'medium' | 'hard') => {
  const gameRef = doc(db, 'games', gameCode);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) {
    throw new Error('Game not found.');
  }
  
  const gameData = gameSnap.data();
  
  if (gameData.players.length >= gameData.settings.maxPlayers) {
    throw new Error('Game is full. Cannot add more bots.');
  }
  
  const botId = `bot-${Date.now()}`;
  const botName = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Bot`;
  
  await updateDoc(gameRef, {
    players: arrayUnion({
      id: botId,
      name: botName,
      isConnected: true,
      isReady: true,
      isBot: true,
      botDifficulty: difficulty
    }),
    settings: {
      ...gameData.settings,
      withBots: true
    },
    lastUpdatedAt: new Date()
  });
  
  return botId;
};

const removePlayer = async (gameCode: string, playerId: string) => {
  const gameRef = doc(db, 'games', gameCode);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) {
    throw new Error('Game not found.');
  }
  
  const gameData = gameSnap.data();
  
  // Filter out the player to remove
  const updatedPlayers = gameData.players.filter((p: any) => p.id !== playerId);
  
  // If host is removed, assign a new host
  let updatedHost = gameData.host;
  if (playerId === gameData.host && updatedPlayers.length > 0) {
    updatedHost = updatedPlayers[0].id;
  }
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    host: updatedHost,
    lastUpdatedAt: new Date()
  });
};

const toggleReady = async (gameCode: string, playerId: string) => {
  const gameRef = doc(db, 'games', gameCode);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) {
    throw new Error('Game not found.');
  }
  
  const gameData = gameSnap.data();
  
  // Update player ready status
  const updatedPlayers = gameData.players.map((p: any) => 
    p.id === playerId ? { ...p, isReady: !p.isReady } : p
  );
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    lastUpdatedAt: new Date()
  });
};

const startGame = async (gameCode: string) => {
  const gameRef = doc(db, 'games', gameCode);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) {
    throw new Error('Game not found.');
  }
  
  const gameData = gameSnap.data();
  
  if (gameData.players.length < 2) {
    throw new Error('Need at least 2 players to start the game.');
  }
  
  if (!gameData.players.every((p: any) => p.isReady)) {
    throw new Error('All players must be ready to start the game.');
  }
  
  // Create and deal tiles
  const deck = createNewTileDeck();
  const { playerRacks, pool } = dealTiles(deck, gameData.players.length);
  
  // Create player racks map
  const racks: Record<string, any> = {};
  gameData.players.forEach((player: any, index: number) => {
    racks[player.id] = playerRacks[`player-${index}`];
  });
  
  // Initialize player initial meld status
  const initialMeldComplete: Record<string, boolean> = {};
  gameData.players.forEach((player: any) => {
    initialMeldComplete[player.id] = false;
  });
  
  await updateDoc(gameRef, {
    status: 'active',
    board: [],
    pool,
    playerRacks: racks,
    initialMeldComplete,
    currentTurn: 0, // First player starts
    lastUpdatedAt: new Date()
  });
};

const sendChatMessage = async (gameCode: string, userId: string, userName: string, content: string) => {
  const messagesRef = collection(db, 'games', gameCode, 'messages');
  const messageId = `msg-${Date.now()}`;
  
  await setDoc(doc(messagesRef, messageId), {
    id: messageId,
    userId,
    userName,
    content,
    timestamp: new Date()
  });
};

export {
  generateUniqueGameCode,
  createGame,
  joinGame,
  addBot,
  removePlayer,
  toggleReady,
  startGame,
  sendChatMessage
};
