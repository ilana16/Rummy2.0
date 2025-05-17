import React, { useState } from 'react';
import styled from 'styled-components';

interface GameRoomProps {
  onCreateRoom: (roomName: string, isPrivate: boolean) => void;
  onJoinRoom: (roomCode: string) => void;
}

const RoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const TabContainer = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px;
  background-color: ${props => props.active ? '#4caf50' : '#f5f5f5'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
  
  &:first-child {
    border-radius: 5px 0 0 5px;
  }
  
  &:last-child {
    border-radius: 0 5px 5px 0;
  }
  
  &:hover {
    background-color: ${props => props.active ? '#388e3c' : '#e0e0e0'};
  }
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  
  input {
    margin-right: 10px;
  }
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;

  &:hover {
    background-color: #388e3c;
  }
`;

const GameRoom: React.FC<GameRoomProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      onCreateRoom(roomName, isPrivate);
    }
  };
  
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoinRoom(roomCode);
    }
  };
  
  return (
    <RoomContainer>
      <TabContainer>
        <Tab 
          active={activeTab === 'create'} 
          onClick={() => setActiveTab('create')}
        >
          Create Game
        </Tab>
        <Tab 
          active={activeTab === 'join'} 
          onClick={() => setActiveTab('join')}
        >
          Join Game
        </Tab>
      </TabContainer>
      
      {activeTab === 'create' ? (
        <Form onSubmit={handleCreateSubmit}>
          <Input
            type="text"
            placeholder="Game Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />
          <Checkbox>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
              id="private-game"
            />
            <label htmlFor="private-game">Create Private Game with Code</label>
          </Checkbox>
          <Button type="submit">Create Game</Button>
        </Form>
      ) : (
        <Form onSubmit={handleJoinSubmit}>
          <Input
            type="text"
            placeholder="Game Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            required
            minLength={4}
          />
          <Button type="submit">Join Game</Button>
        </Form>
      )}
    </RoomContainer>
  );
};

export default GameRoom;
