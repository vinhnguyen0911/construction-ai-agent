import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '../lib/cn';

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}) {
  return (
    <div className="w-64 bg-civil-secondary dark:bg-civil-secondary-dark border-r border-civil-border dark:border-civil-border-dark flex flex-col h-full">
      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-accent dark:border-accent-dark text-accent dark:text-accent-dark rounded-lg text-sm font-medium hover:bg-accent-light dark:hover:bg-accent-dark-light transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {conversations.map((conv) => {
          const isActive = activeId === conv.id;
          const time = conv.updated_at
            ? new Date(conv.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={conv.id}
              className={cn(
                'group flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors duration-150 relative',
                isActive
                  ? 'bg-accent-light dark:bg-accent-dark-light text-accent dark:text-accent-dark font-medium'
                  : 'text-civil-text-secondary dark:text-civil-text-secondary-dark hover:bg-civil-border/40 dark:hover:bg-civil-border-dark/40'
              )}
              onClick={() => onSelect(conv.id)}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent dark:bg-accent-dark rounded-r-full" />
              )}
              <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="block truncate">{conv.title}</span>
                {time && (
                  <span className="block text-[11px] text-civil-muted dark:text-civil-muted-dark mt-0.5">{time}</span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="hidden group-hover:block p-1 text-civil-muted dark:text-civil-muted-dark hover:text-civil-danger rounded flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {conversations.length === 0 && (
          <p className="text-xs text-civil-muted dark:text-civil-muted-dark text-center py-8">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  );
}
