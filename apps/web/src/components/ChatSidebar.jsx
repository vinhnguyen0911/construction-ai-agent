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
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex items-center gap-2 w-full px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cuoc tro chuyen moi
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors',
              activeId === conv.id
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            onClick={() => onSelect(conv.id)}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="hidden group-hover:block p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            Chua co cuoc tro chuyen nao
          </p>
        )}
      </div>
    </div>
  );
}
