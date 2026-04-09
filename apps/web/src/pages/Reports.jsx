import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import ReportCard from '../components/ReportCard';
import { getReports, runReports } from '../lib/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bao cao thoi tiet</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Bao cao tu dong hang ngay cho cac khu vuc thi cong
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {generating ? 'Dang tao...' : 'Tao bao cao'}
          </button>
        </div>

        {/* Reports list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Chua co bao cao nao</p>
            <p className="text-sm mt-1">Nhan "Tao bao cao" de tao bao cao moi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
