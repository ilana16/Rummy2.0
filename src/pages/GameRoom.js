import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, onValue, update, push, set, remove } from 'firebase/database';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useGameLogic } from '../hooks/useGameLogic';

// Styled components from previous implementation...

// New components for drag and drop functionality
const DraggableTile = ({ tile, index, onDragStart, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'tile',
    item: { tile, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    begin: () => {
      if (onDragStart) onDragStart(tile, index);
    },
    end: (item, monitor) => {
      if (onDragEnd) onDragEnd(monitor.didDrop());
    },
  }));

  const tileColor = tile.isJoker ? 'joker' : tile.color;
  
  return tile.isJoker ? (
    <JokerTile 
      ref={drag} 
      isDragging={isDragging}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <JokerStar>★</JokerStar>
    </JokerTile>
  ) : (
    <Tile 
      ref={drag} 
      isDragging={isDragging}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <TileNumber color={tileColor}>{tile.number}</TileNumber>
    </Tile>
  );
};

const DroppableArea = ({ onDrop, children, setId }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'tile',
    drop: (item) => {
      if (onDrop) onDrop(item, setId);
      return { setId };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop} 
      style={{ 
        position: 'relative',
        backgroundColor: isOver ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        borderRadius: '4px',
        transition: 'background-color 0.3s'
      }}
    >
      {children}
    </div>
  );
};

const GameRoom = () => {
  const { gameId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [manipulationMode, setManipulationMode] = useState(false);
  const [manipulationPlan, setManipulationPlan] = useState({ newSets: [], tilesFromRack: [] });
  const chatEndRef = useRef(null);
  const database = getDatabase();
  
  // Use the game logic hook
  const {
    gameState,
    playerRack,
    tableSets,
    currentTurn,
    isInitialMeld,
    validationError,
    gameOver,
    winner,
    startGame,
    drawTile,
    playTiles,
    manipulateTiles,
    retrieveJoker,
    isValidSet,
    calculatePoints
  } = useGameLogic(gameId);

  useEffect(() => {
    // Redirect to login if not authenticated or email not verified
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.emailVerified) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Listen for chat messages
    const chatRef = ref(database, `games/${gameId}/chat`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const chatData = snapshot.val();
      if (chatData) {
        const messagesArray = Object.entries(chatData).map(([id, message]) => ({
          id,
          ...message
        }));
        // Sort by timestamp
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setChatMessages(messagesArray);
        
        // Scroll to bottom of chat
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        setChatMessages([]);
      }
    });

    return () => unsubscribe();
  }, [gameId, database]);

  const handleLeaveGame = () => {
    if (!gameState) return;
    
    // If host is leaving and there are other players, transfer host status
    if (gameState.players[currentUser.uid].isHost && Object.keys(gameState.players).length > 1) {
      const otherPlayers = Object.entries(gameState.players)
        .filter(([id]) => id !== currentUser.uid);
      
      if (otherPlayers.length > 0) {
        // Transfer host to first other player
        const [newHostId] = otherPlayers[0];
        const newHostRef = ref(database, `games/${gameId}/players/${newHostId}`);
        update(newHostRef, { isHost: true });
      }
    }
    
    // Remove player from game
    const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`);
    remove(playerRef).then(() => {
      // Check if this was the last player
      const remainingPlayers = { ...gameState.players };
      delete remainingPlayers[currentUser.uid];
      
      if (Object.keys(remainingPlayers).length === 0) {
        // Last player left, remove the game
        const gameRef = ref(database, `games/${gameId}`);
        remove(gameRef);
      }
      
      navigate('/lobby');
    });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const chatRef = ref(database, `games/${gameId}/chat`);
    const newMessageRef = push(chatRef);
    
    set(newMessageRef, {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      text: chatMessage.trim(),
      timestamp: Date.now()
    });
    
    setChatMessage('');
  };

  const handleTileClick = (tile, index) => {
    // Toggle selection of tile
    const isSelected = selectedTiles.some(t => t.id === tile.id);
    
    if (isSelected) {
      setSelectedTiles(selectedTiles.filter(t => t.id !== tile.id));
    } else {
      setSelectedTiles([...selectedTiles, tile]);
    }
  };

  const handlePlaySelectedTiles = () => {
    if (selectedTiles.length === 0) return;
    
    // Play tiles to form a new set
    playTiles(selectedTiles);
    setSelectedTiles([]);
  };

  const handleAddToSet = (setIndex) => {
    if (selectedTiles.length === 0) return;
    
    // Add selected tiles to existing set
    playTiles(selectedTiles, setIndex);
    setSelectedTiles([]);
  };

  const handleDrawTile = () => {
    drawTile();
  };

  const handleToggleManipulation = () => {
    setManipulationMode(!manipulationMode);
    setManipulationPlan({ newSets: [...tableSets], tilesFromRack: [] });
  };

  const handleApplyManipulation = () => {
    manipulateTiles(manipulationPlan);
    setManipulationMode(false);
    setManipulationPlan({ newSets: [], tilesFromRack: [] });
  };

  const handleDragStart = (tile, index) => {
    // Track which tile is being dragged
    console.log('Drag started:', tile);
  };

  const handleDragEnd = (didDrop) => {
    // Handle drag end logic if needed
    console.log('Drag ended, dropped:', didDrop);
  };

  const handleDropOnSet = (item, setId) => {
    if (manipulationMode) {
      // In manipulation mode, handle complex tile movements
      const { tile } = item;
      
      // Check if tile is from rack or from another set
      const isFromRack = playerRack.some(t => t.id === tile.id);
      
      if (isFromRack) {
        // Add tile from rack to the set
        const updatedSets = [...manipulationPlan.newSets];
        updatedSets[setId] = [...updatedSets[setId], tile];
        
        // Add to tiles from rack list
        const updatedTilesFromRack = [...manipulationPlan.tilesFromRack, tile];
        
        setManipulationPlan({
          newSets: updatedSets,
          tilesFromRack: updatedTilesFromRack
        });
      } else {
        // Move tile from one set to another
        // Find which set the tile is from
        let sourceSetId = -1;
        let tileIndex = -1;
        
        manipulationPlan.newSets.forEach((set, idx) => {
          const index = set.findIndex(t => t.id === tile.id);
          if (index !== -1) {
            sourceSetId = idx;
            tileIndex = index;
          }
        });
        
        if (sourceSetId !== -1 && sourceSetId !== setId) {
          // Remove from source set
          const updatedSets = [...manipulationPlan.newSets];
          const sourceTiles = [...updatedSets[sourceSetId]];
          sourceTiles.splice(tileIndex, 1);
          updatedSets[sourceSetId] = sourceTiles;
          
          // Add to target set
          updatedSets[setId] = [...updatedSets[setId], tile];
          
          setManipulationPlan({
            ...manipulationPlan,
            newSets: updatedSets
          });
        }
      }
    } else {
      // In normal mode, add selected tiles to the set
      handleAddToSet(setId);
    }
  };

  const handleDropOnNewSet = (item) => {
    if (manipulationMode) {
      // In manipulation mode, create a new set
      const { tile } = item;
      
      // Check if tile is from rack or from another set
      const isFromRack = playerRack.some(t => t.id === tile.id);
      
      if (isFromRack) {
        // Create new set with tile from rack
        const updatedSets = [...manipulationPlan.newSets, [tile]];
        
        // Add to tiles from rack list
        const updatedTilesFromRack = [...manipulationPlan.tilesFromRack, tile];
        
        setManipulationPlan({
          newSets: updatedSets,
          tilesFromRack: updatedTilesFromRack
        });
      } else {
        // Move tile from existing set to new set
        // Find which set the tile is from
        let sourceSetId = -1;
        let tileIndex = -1;
        
        manipulationPlan.newSets.forEach((set, idx) => {
          const index = set.findIndex(t => t.id === tile.id);
          if (index !== -1) {
            sourceSetId = idx;
            tileIndex = index;
          }
        });
        
        if (sourceSetId !== -1) {
          // Remove from source set
          const updatedSets = [...manipulationPlan.newSets];
          const sourceTiles = [...updatedSets[sourceSetId]];
          sourceTiles.splice(tileIndex, 1);
          updatedSets[sourceSetId] = sourceTiles;
          
          // Create new set
          updatedSets.push([tile]);
          
          setManipulationPlan({
            ...manipulationPlan,
            newSets: updatedSets
          });
        }
      }
    } else {
      // In normal mode, play selected tiles as a new set
      handlePlaySelectedTiles();
    }
  };

  const renderGameBoard = () => {
    if (!tableSets) return null;
    
    return (
      <div>
        <GameStatusBar>
          <CurrentTurnIndicator isCurrentUserTurn={currentTurn === currentUser.uid}>
            {currentTurn === currentUser.uid ? 'Your Turn' : `${gameState?.players[currentTurn]?.name || 'Player'}'s Turn`}
          </CurrentTurnIndicator>
          <div>
            Tiles in pool: {gameState?.pool?.length || 0}
          </div>
        </GameStatusBar>
        
        <TileContainer>
          {manipulationMode ? (
            // Render sets in manipulation mode
            manipulationPlan.newSets.map((set, setIndex) => (
              <DroppableArea key={setIndex} onDrop={handleDropOnSet} setId={setIndex}>
                <SetContainer>
                  {set.map((tile, tileIndex) => (
                    <DraggableTile
                      key={`${tile.id}-${tileIndex}`}
                      tile={tile}
                      index={tileIndex}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </SetContainer>
              </DroppableArea>
            ))
          ) : (
            // Render sets in normal mode
            tableSets.map((set, setIndex) => (
              <DroppableArea key={setIndex} onDrop={handleDropOnSet} setId={setIndex}>
                <SetContainer>
                  {set.map((tile, tileIndex) => (
                    tile.isJoker ? (
                      <JokerTile key={`${tile.id}-${tileIndex}`}>
                        <JokerStar>★</JokerStar>
                      </JokerTile>
                    ) : (
                      <Tile key={`${tile.id}-${tileIndex}`}>
                        <TileNumber color={tile.color}>{tile.number}</TileNumber>
                      </Tile>
                    )
                  ))}
                </SetContainer>
              </DroppableArea>
            ))
          )}
          
          {/* New set drop area */}
          <DroppableArea onDrop={handleDropOnNewSet}>
            <SetContainer style={{ 
              minHeight: '80px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Drop tiles here to create a new set
              </div>
            </SetContainer>
          </DroppableArea>
        </TileContainer>
        
        {validationError && (
          <div style={{ 
            backgroundColor: '#f44336', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            {validationError}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {currentTurn === currentUser.uid && (
            <>
              <Button 
                onClick={handleDrawTile}
                disabled={manipulationMode}
              >
                Draw Tile
              </Button>
              
              <Button 
                secondary 
                onClick={handleToggleManipulation}
              >
                {manipulationMode ? 'Cancel Manipulation' : 'Manipulate Sets'}
              </Button>
              
              {manipulationMode && (
                <Button 
                  primary 
                  onClick={handleApplyManipulation}
                >
                  Apply Changes
                </Button>
              )}
              
              {!manipulationMode && selectedTiles.length > 0 && (
                <Button 
                  primary 
                  onClick={handlePlaySelectedTiles}
                >
                  Play Selected Tiles
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPlayerRack = () => {
    if (!playerRack) return null;
    
    return (
      <PlayerRack>
        {playerRack.map((tile, index) => (
          <div 
            key={tile.id} 
            onClick={() => handleTileClick(tile, index)}
            style={{ 
              position: 'relative',
              transform: selectedTiles.some(t => t.id === tile.id) ? 'translateY(-10px)' : 'none',
              transition: 'transform 0.2s'
            }}
          >
            <DraggableTile
              tile={tile}
              index={index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        ))}
      </PlayerRack>
    );
  };

  const renderWaitingRoom = () => {
    if (!gameState) return null;
    
    return (
      <WaitingRoomContainer>
        <WaitingRoomTitle>Waiting Room</WaitingRoomTitle>
        
        <PlayersList>
          {gameState.players && Object.values(gameState.players).map(player => (
            <PlayerItem key={player.id}>
              <PlayerAvatar src={player.photoURL || 'https://via.placeholder.com/40'} />
              <PlayerName isHost={player.isHost}>
                {player.name}
              </PlayerName>
              <ReadyStatus isReady={player.isReady}>
                {player.isReady ? 'Ready' : 'Not Ready'}
              </ReadyStatus>
            </PlayerItem>
          ))}
        </PlayersList>
        
        <ButtonContainer>
          <Button onClick={handleLeaveGame}>Leave Game</Button>
          <Button 
            secondary 
            onClick={() => {
              const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`);
              update(playerRef, {
                isReady: !gameState.players[currentUser.uid].isReady
              });
            }}
          >
            {gameState.players[currentUser.uid].isReady ? 'Not Ready' : 'Ready'}
          </Button>
          {gameState.players[currentUser.uid].isHost && (
            <Button 
              primary 
              onClick={startGame}
              disabled={Object.keys(gameState.players).length < 2 || 
                       !Object.values(gameState.players).every(player => player.isReady)}
            >
              Start Game
            </Button>
          )}
        </ButtonContainer>
      </WaitingRoomContainer>
    );
  };

  const renderGameOver = () => {
    if (!gameOver || !winner) return null;
    
    const winnerName = gameState?.players[winner]?.name || 'Player';
    const isCurrentUserWinner = winner === currentUser.uid;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ marginTop: 0 }}>Game Over</h2>
          <h3>{isCurrentUserWinner ? 'You won!' : `${winnerName} won!`}</h3>
          <p>Thanks for playing!</p>
          <Button primary onClick={() => navigate('/lobby')}>
            Return to Lobby
          </Button>
        </div>
      </div>
    );
  };

  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <GameRoomContainer>
      <Header>
        <Logo>Rummy Tile Game</Logo>
        <GameCode>Code: {gameState.gameCode}</GameCode>
        <UserSection>
          <Avatar 
            src={currentUser.photoURL || 'https://via.placeholder.com/32'} 
            onClick={() => navigate('/profile')}
          />
        </UserSection>
      </Header>
      
      {gameState.status === 'waiting' ? (
        renderWaitingRoom()
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
            <GameBoardContainer>
              <GameBoard>
                {renderGameBoard()}
              </GameBoard>
              {renderPlayerRack()}
            </GameBoardContainer>
            
            <ChatContainer>
              <ChatHeader>Game Chat</ChatHeader>
              <ChatMessages>
                {chatMessages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    isCurrentUser={msg.senderId === currentUser.uid}
                  >
                    <MessageSender isCurrentUser={msg.senderId === currentUser.uid}>
                      {msg.senderName}
                    </MessageSender>
                    <MessageText>{msg.text}</MessageText>
                  </ChatMessage>
                ))}
                <div ref={chatEndRef} />
              </ChatMessages>
              <ChatInput>
                <ChatTextInput 
                  type="text" 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <SendButton onClick={handleSendMessage}>Send</SendButton>
              </ChatInput>
            </ChatContainer>
          </div>
        </DndProvider>
      )}
      
      {renderGameOver()}
    </GameRoomContainer>
  );
};

export default GameRoom;
