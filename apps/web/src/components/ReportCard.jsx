import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MapPin, Calendar } from 'lucide-react';

export default function ReportCard({ report }) {
  const date = new Date(report.report_date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{report.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 prose prose-sm max-w-none prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-td:border prose-th:border">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown>
      </div>
    </div>
  );
}
