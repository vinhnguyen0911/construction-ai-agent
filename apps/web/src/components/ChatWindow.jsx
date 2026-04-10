import { useState, useRef, useEffect } from 'react';
import { SendHorizonal, Loader2, HardHat } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { sendMessage } from '../lib/api';

const SUGGESTION_CHIPS = [
  'Thời tiết TPHCM hôm nay',
  'Dự báo 3 ngày tới Đồng Nai',
  'Có nên đổ bê tông hôm nay?',
];

export default function ChatWindow({
  messages,
  conversationId,
  onNewConversation,
  onMessageSent,
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [toolStatus, setToolStatus] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const submitMessage = async (text) => {
    if (!text.trim() || loading) return;

    setInput('');
    setLoading(true);
    setStreamingText('');
    setToolStatus('');

    onMessageSent({ role: 'user', content: text.trim() });

    let fullText = '';

    try {
      await sendMessage(text.trim(), conversationId, (event) => {
        switch (event.type) {
          case 'conversation':
            onNewConversation(event.conversationId);
            break;
          case 'chunk':
            fullText += event.text;
            setStreamingText(fullText);
            setToolStatus('');
            break;
          case 'functionCalls':
            if (event.calls?.[0]) {
              const city = event.calls[0].args?.city || '';
              setToolStatus(`Analyzing weather${city ? ` in ${city}` : ''}...`);
            }
            break;
          case 'done':
            fullText = event.text;
            setStreamingText('');
            setToolStatus('');
            onMessageSent({ role: 'model', content: fullText });
            break;
          case 'error':
            setStreamingText('');
            setToolStatus('');
            onMessageSent({ role: 'model', content: `Error: ${event.error}` });
            break;
        }
      });
    } catch (err) {
      setStreamingText('');
      setToolStatus('');
      onMessageSent({ role: 'model', content: `Connection error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMessage(input);
  };

  const isEmpty = messages.length === 0 && !streamingText;

  return (
    <div className="flex flex-col h-full bg-civil-bg dark:bg-civil-bg-dark">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
              <HardHat className="w-12 h-12 text-civil-muted dark:text-civil-muted-dark mb-4" />
              <p className="text-lg font-semibold text-civil-text dark:text-civil-text-dark">
                Xin chào! Tôi là Civil Bot
              </p>
              <p className="text-sm text-civil-muted dark:text-civil-muted-dark mt-1.5 max-w-md">
                Trợ lý AI cho công trường xây dựng. Hỏi tôi về thời tiết và khuyến nghị thi công.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => submitMessage(chip)}
                    className="px-4 py-2 text-sm border border-civil-border dark:border-civil-border-dark rounded-full text-civil-text-secondary dark:text-civil-text-secondary-dark hover:bg-accent-light dark:hover:bg-accent-dark-light hover:text-accent dark:hover:text-accent-dark hover:border-accent/30 dark:hover:border-accent-dark/30 transition-colors duration-150 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {streamingText && <MessageBubble role="model" content={streamingText} />}

          {/* Tool calling status */}
          {loading && toolStatus && (
            <div className="flex items-center gap-2 py-2 pl-10 animate-fade-in">
              <Loader2 className="w-3.5 h-3.5 text-accent dark:text-accent-dark animate-spin" />
              <span className="text-sm text-civil-muted dark:text-civil-muted-dark italic">{toolStatus}</span>
            </div>
          )}

          {/* Loading indicator */}
          {loading && !streamingText && !toolStatus && (
            <div className="flex items-center gap-3 py-2 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-accent dark:bg-accent-dark flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <span className="text-sm text-civil-muted dark:text-civil-muted-dark">Thinking...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-civil-border dark:border-civil-border-dark bg-civil-bg dark:bg-civil-bg-dark">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về thời tiết, khuyến nghị thi công..."
              disabled={loading}
              className="w-full px-4 py-3 pr-12 bg-surface dark:bg-surface-dark border border-civil-border dark:border-civil-border-dark rounded-xl text-sm text-civil-text dark:text-civil-text-dark placeholder:text-civil-muted dark:placeholder:text-civil-muted-dark focus:outline-none focus:border-accent dark:focus:border-accent-dark focus:ring-[3px] focus:ring-accent-light dark:focus:ring-accent-dark-light disabled:opacity-60 transition-all duration-150"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-accent dark:bg-accent-dark text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-hover dark:hover:bg-accent-dark-hover transition-colors duration-150"
            >
              <SendHorizonal className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
