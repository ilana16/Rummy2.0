import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

const ChatContainer = styled.div`
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ChatHeader = styled.div`
  padding: 10px;
  background-color: #f5f5f5;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ChatMessage = styled.div`
  padding: 8px 12px;
  background-color: ${props => props.isCurrentUser ? '#e3f2fd' : '#f5f5f5'};
  border-radius: 8px;
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
  max-width: 80%;
`;

const MessageSender = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 4px;
  color: ${props => props.isCurrentUser ? '#1976d2' : '#333'};
`;

const MessageText = styled.div`
  word-break: break-word;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: #757575;
  text-align: right;
  margin-top: 4px;
`;

const ChatInput = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid #eee;
`;

const ChatTextInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
`;

const SendButton = styled.button`
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #3367D6;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ChatToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #4285F4;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const useGameChat = (gameId, messageLimit = 50) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const database = getDatabase();
  const chatEndRef = useRef(null);

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Load chat messages
  useEffect(() => {
    if (!gameId) return;
    
    setLoading(true);
    const chatRef = query(
      ref(database, `games/${gameId}/chat`),
      orderByChild('timestamp'),
      limitToLast(messageLimit)
    );
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      try {
        const chatData = snapshot.val();
        if (chatData) {
          const messagesArray = Object.entries(chatData).map(([id, message]) => ({
            id,
            ...message,
            formattedTime: formatTime(message.timestamp)
          }));
          
          // Sort by timestamp
          messagesArray.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(messagesArray);
        } else {
          setMessages([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading chat messages:", err);
        setError("Failed to load chat messages");
        setLoading(false);
      }
    }, (err) => {
      console.error("Error in chat listener:", err);
      setError("Failed to connect to chat");
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [gameId, database, messageLimit]);

  // Send a message
  const sendMessage = async (text) => {
    if (!gameId || !currentUser || !text.trim()) return;
    
    try {
      const chatRef = ref(database, `games/${gameId}/chat`);
      const newMessageRef = push(chatRef);
      
      await set(newMessageRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        text: text.trim(),
        timestamp: Date.now()
      });
      
      return true;
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      return false;
    }
  };

  // Send a system message
  const sendSystemMessage = async (text) => {
    if (!gameId || !text.trim()) return;
    
    try {
      const chatRef = ref(database, `games/${gameId}/chat`);
      const newMessageRef = push(chatRef);
      
      await set(newMessageRef, {
        senderId: 'system',
        senderName: 'System',
        text: text.trim(),
        timestamp: Date.now(),
        isSystem: true
      });
      
      return true;
    } catch (err) {
      console.error("Error sending system message:", err);
      return false;
    }
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    sendSystemMessage,
    chatEndRef,
    scrollToBottom
  };
};

const GameChat = ({ gameId, collapsed = false, onToggleCollapse }) => {
  const [message, setMessage] = useState('');
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    chatEndRef, 
    scrollToBottom 
  } = useGameChat(gameId);
  const { currentUser } = useAuth();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      const success = await sendMessage(message);
      if (success) {
        setMessage('');
      }
    }
  };

  if (collapsed) {
    return (
      <ChatHeader>
        <span>Game Chat</span>
        <ChatToggleButton onClick={onToggleCollapse}>Show</ChatToggleButton>
      </ChatHeader>
    );
  }

  return (
    <ChatContainer>
      <ChatHeader>
        <span>Game Chat</span>
        <ChatToggleButton onClick={onToggleCollapse}>Hide</ChatToggleButton>
      </ChatHeader>
      
      <ChatMessages>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading messages...</div>
        ) : error ? (
          <div style={{ color: '#f44336', textAlign: 'center', padding: '20px' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#757575' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              isCurrentUser={msg.senderId === currentUser?.uid}
            >
              <MessageSender isCurrentUser={msg.senderId === currentUser?.uid}>
                {msg.senderName}
              </MessageSender>
              <MessageText>{msg.text}</MessageText>
              <MessageTime>{msg.formattedTime}</MessageTime>
            </ChatMessage>
          ))
        )}
        <div ref={chatEndRef} />
      </ChatMessages>
      
      <ChatInput>
        <ChatTextInput 
          type="text" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <SendButton onClick={handleSendMessage}>Send</SendButton>
      </ChatInput>
    </ChatContainer>
  );
};

export { useGameChat, GameChat };
export default GameChat;
