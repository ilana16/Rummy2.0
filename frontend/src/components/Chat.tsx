import React from 'react';
import styled from 'styled-components';

interface ChatProps {
  messages: Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
  }>;
  onSendMessage: (message: string) => void;
}

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 400px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const ChatHeader = styled.div`
  background-color: #4caf50;
  color: white;
  padding: 10px;
  font-weight: bold;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const Message = styled.div<{ isCurrentUser: boolean }>`
  max-width: 80%;
  padding: 8px 12px;
  margin: 5px 0;
  border-radius: 18px;
  background-color: ${props => props.isCurrentUser ? '#e3f2fd' : '#f5f5f5'};
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageSender = styled.div`
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const MessageContent = styled.div`
  word-break: break-word;
`;

const MessageTime = styled.div`
  font-size: 10px;
  color: #757575;
  text-align: right;
  margin-top: 4px;
`;

const ChatInputContainer = styled.form`
  display: flex;
  padding: 10px;
  border-top: 1px solid #eee;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #4caf50;
  }
`;

const SendButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #388e3c;
  }
`;

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const currentUserId = 'current-user-id'; // This would come from authentication
  
  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <ChatContainer>
      <ChatHeader>Game Chat</ChatHeader>
      <MessagesContainer>
        {messages.map(message => (
          <Message 
            key={message.id} 
            isCurrentUser={message.userId === currentUserId}
          >
            <MessageSender>{message.userName}</MessageSender>
            <MessageContent>{message.content}</MessageContent>
            <MessageTime>{formatTime(message.timestamp)}</MessageTime>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <ChatInputContainer onSubmit={handleSubmit}>
        <ChatInput
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <SendButton type="submit">
          <span>➤</span>
        </SendButton>
      </ChatInputContainer>
    </ChatContainer>
  );
};

export default Chat;
