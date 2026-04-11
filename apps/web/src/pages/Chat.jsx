import { useState, useEffect, useCallback } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import ConfirmDialog from '../components/ConfirmDialog';
import { getConversations, getMessages, deleteConversation } from '../lib/api';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationToDelete, setConversationToDelete] = useState(null);

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

  const handleDeleteRequest = (conv) => {
    setConversationToDelete(conv);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    const { id } = conversationToDelete;
    try {
      await deleteConversation(id);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setConversationToDelete(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
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
        onDelete={handleDeleteRequest}
      />
      <div className="flex-1">
        <ChatWindow
          messages={messages}
          conversationId={activeId}
          onNewConversation={handleNewConversation}
          onMessageSent={handleMessageSent}
        />
      </div>

      <ConfirmDialog
        open={!!conversationToDelete}
        title="Delete conversation?"
        message={
          conversationToDelete
            ? `Are you sure you want to delete "${conversationToDelete.title || 'this conversation'}"? All messages will be permanently removed.`
            : ''
        }
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConversationToDelete(null)}
      />
    </div>
  );
}
