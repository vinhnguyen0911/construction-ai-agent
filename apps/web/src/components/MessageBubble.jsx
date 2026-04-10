import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end py-2 animate-message">
        <div className="max-w-[75%] bg-civil-chat-user dark:bg-civil-chat-user-dark rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed text-civil-text dark:text-civil-text-dark">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-2 animate-message">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-accent dark:bg-accent-dark flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Content — no background, like Claude */}
      <div className="flex-1 min-w-0 max-w-[85%]">
        <div className="prose prose-sm max-w-none leading-[1.7] text-civil-text dark:text-civil-text-dark dark:prose-invert prose-headings:text-civil-text dark:prose-headings:text-civil-text-dark prose-strong:font-semibold">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
