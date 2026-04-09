import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { sendMessage } from '../lib/api';

export default function ChatWindow({
  messages,
  conversationId,
  onNewConversation,
  onMessageSent,
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input on mount / conversation change
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setStreamingText('');

    // Optimistic: show user message immediately
    onMessageSent({ role: 'user', content: text });

    let fullText = '';
    let convId = conversationId;

    try {
      await sendMessage(text, conversationId, (event) => {
        switch (event.type) {
          case 'conversation':
            convId = event.conversationId;
            onNewConversation(convId);
            break;
          case 'chunk':
            fullText += event.text;
            setStreamingText(fullText);
            break;
          case 'done':
            fullText = event.text;
            setStreamingText('');
            onMessageSent({ role: 'model', content: fullText });
            break;
          case 'error':
            setStreamingText('');
            onMessageSent({
              role: 'model',
              content: `Error: ${event.error}`,
            });
            break;
        }
      });
    } catch (err) {
      setStreamingText('');
      onMessageSent({
        role: 'model',
        content: `Connection error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-lg font-medium">Construction AI Agent</p>
            <p className="text-sm mt-1">Ask any question about weather and construction</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Streaming message */}
        {streamingText && (
          <MessageBubble role="model" content={streamingText} />
        )}

        {/* Loading indicator */}
        {loading && !streamingText && (
          <div className="flex gap-3 py-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5">
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about weather, construction..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
