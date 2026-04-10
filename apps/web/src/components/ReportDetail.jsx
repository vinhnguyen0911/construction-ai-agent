import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, MapPin, Calendar } from 'lucide-react';

export default function ReportDetail({ report, onClose }) {
  if (!report) return null;

  const date = new Date(report.report_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-surface dark:bg-surface-dark rounded-xl border border-civil-border dark:border-civil-border-dark shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-civil-border dark:border-civil-border-dark flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-civil-text dark:text-civil-text-dark">
              <MapPin className="w-4 h-4 text-accent dark:text-accent-dark" />
              {report.location}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-civil-muted dark:text-civil-muted-dark">
              <Calendar className="w-4 h-4" />
              {date}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-civil-muted dark:text-civil-muted-dark hover:bg-civil-border/50 dark:hover:bg-civil-border-dark/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="prose prose-sm max-w-none text-civil-text dark:text-civil-text-dark dark:prose-invert leading-[1.7]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
