import { MapPin, Thermometer, Droplets, Wind, Trash2 } from 'lucide-react';

/**
 * Extract a quick summary from the markdown report content.
 * Looks for temperature, humidity, wind, and a short description.
 */
function extractSummary(content) {
  const tempMatch = content.match(/(\d{1,3}(?:\.\d+)?)\s*°C/);
  const humidityMatch = content.match(/(?:humidity|độ ẩm)[:\s]*(\d{1,3})%/i) || content.match(/(\d{1,3})%/);
  const windMatch = content.match(/(\d{1,2}(?:\.\d{1,2})?)\s*(?:km\/h|m\/s)/i);

  // Try to find a recommendation line
  const lines = content.split('\n').filter((l) => l.trim());
  let summary = '';
  for (const line of lines) {
    if (line.includes('✅') || line.includes('⚠️') || line.includes('❌') || line.includes('Thuận lợi') || line.includes('thuận lợi')) {
      summary = line.replace(/[*#\-|]/g, '').trim().slice(0, 80);
      break;
    }
  }
  if (!summary) {
    summary = lines.find((l) => l.length > 20 && !l.startsWith('|') && !l.startsWith('#'))?.replace(/[*#]/g, '').trim().slice(0, 80) || '';
  }

  return {
    temperature: tempMatch ? Math.round(parseFloat(tempMatch[1])).toString() : null,
    humidity: humidityMatch ? humidityMatch[1] : null,
    wind: windMatch ? windMatch[0] : null,
    summary,
  };
}

export default function ReportCard({ report, onClick, onDelete }) {
  const { temperature, humidity, wind, summary } = extractSummary(report.content);

  return (
    <div
      onClick={onClick}
      className="bg-surface dark:bg-surface-dark border border-civil-border dark:border-civil-border-dark rounded-xl p-5 cursor-pointer hover:shadow-md dark:hover:shadow-black/30 transition-shadow duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-civil-text dark:text-civil-text-dark">
            <MapPin className="w-4 h-4 text-accent dark:text-accent-dark" />
            {report.location}
          </div>
          <p className="text-[11px] text-civil-muted dark:text-civil-muted-dark mt-0.5">
            {new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {temperature && (
            <span className="text-2xl font-bold text-accent dark:text-accent-dark">{temperature}°C</span>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(report);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-civil-muted dark:text-civil-muted-dark hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-sm text-civil-text-secondary dark:text-civil-text-secondary-dark mb-3 line-clamp-2">
          {summary}
        </p>
      )}

      {/* Mini stats */}
      <div className="flex items-center gap-4 text-xs text-civil-muted dark:text-civil-muted-dark">
        {humidity && (
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3" /> {humidity}%
          </span>
        )}
        {wind && (
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3" /> {wind}
          </span>
        )}
        {temperature && (
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3" /> {temperature}°C
          </span>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-accent dark:text-accent-dark font-medium mt-3 group-hover:underline">
        View details
      </p>
    </div>
  );
}
