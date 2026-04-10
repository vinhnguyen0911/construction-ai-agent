import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import ReportCard from '../components/ReportCard';
import ReportDetail from '../components/ReportDetail';
import { getReports, runReports } from '../lib/api';

/**
 * Group reports by date, newest first.
 */
function groupByDate(reports) {
  const groups = {};
  for (const report of reports) {
    const key = report.report_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(report);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      items,
    }));
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await runReports();
      await loadReports();
    } catch (err) {
      console.error('Failed to generate reports:', err);
    } finally {
      setGenerating(false);
    }
  };

  const groups = groupByDate(reports);

  return (
    <div className="h-full overflow-y-auto bg-civil-bg dark:bg-civil-bg-dark">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-civil-text dark:text-civil-text-dark">
              Weather Reports
            </h1>
            <p className="text-sm text-civil-muted dark:text-civil-muted-dark mt-0.5">
              Auto-updated daily at 7:00 AM
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-accent dark:bg-accent-dark text-white rounded-lg text-sm font-medium hover:bg-accent-hover dark:hover:bg-accent-dark-hover disabled:opacity-50 transition-colors duration-150"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-civil-muted animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-civil-muted dark:text-civil-muted-dark animate-fade-in">
            <p className="text-lg">No reports yet</p>
            <p className="text-sm mt-1">Click "Generate Report" to create a new report</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {groups.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-medium text-civil-text-secondary dark:text-civil-text-secondary-dark whitespace-nowrap">
                    {group.label}
                  </h2>
                  <div className="flex-1 h-px bg-civil-border dark:bg-civil-border-dark" />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onClick={() => setSelectedReport(report)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedReport && (
        <ReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}
