import { useState, useEffect, useCallback } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import { getConversations, getMessages, deleteConversation } from '../lib/api';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const data = await getMessages(activeId);
        setMessages(data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    })();
  }, [activeId]);

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
  };

  const handleDelete = async (id) => {
    try {
      await deleteConversation(id);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleNewConversation = (convId) => {
    setActiveId(convId);
    loadConversations();
  };

  const handleMessageSent = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="flex h-full">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewChat}
        onDelete={handleDelete}
      />
      <div className="flex-1">
        <ChatWindow
          messages={messages}
          conversationId={activeId}
          onNewConversation={handleNewConversation}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}
