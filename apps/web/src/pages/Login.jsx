import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  useDarkMode(); // Ensure dark class is applied on login page

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-civil-bg via-accent-light/20 to-civil-secondary dark:from-civil-bg-dark dark:via-accent-dark-light/20 dark:to-civil-secondary-dark">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent dark:bg-accent-dark rounded-2xl mb-4 shadow-lg shadow-accent/20 dark:shadow-accent-dark/20">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-civil-text dark:text-civil-text-dark">Civil Bot</h1>
          <p className="text-sm text-civil-muted dark:text-civil-muted-dark mt-1">Sign in to continue</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface dark:bg-surface-dark rounded-xl border border-civil-border dark:border-civil-border-dark p-6 space-y-4 shadow-xl shadow-black/5 dark:shadow-black/20"
        >
          {error && (
            <div className="text-sm text-civil-danger bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-civil-text-secondary dark:text-civil-text-secondary-dark mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-civil-bg dark:bg-civil-bg-dark border border-civil-border dark:border-civil-border-dark rounded-lg text-sm text-civil-text dark:text-civil-text-dark placeholder:text-civil-muted dark:placeholder:text-civil-muted-dark focus:outline-none focus:border-accent dark:focus:border-accent-dark focus:ring-[3px] focus:ring-accent-light dark:focus:ring-accent-dark-light transition-all duration-150"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-civil-text-secondary dark:text-civil-text-secondary-dark mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-civil-bg dark:bg-civil-bg-dark border border-civil-border dark:border-civil-border-dark rounded-lg text-sm text-civil-text dark:text-civil-text-dark placeholder:text-civil-muted dark:placeholder:text-civil-muted-dark focus:outline-none focus:border-accent dark:focus:border-accent-dark focus:ring-[3px] focus:ring-accent-light dark:focus:ring-accent-dark-light transition-all duration-150"
              placeholder="admin"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent dark:bg-accent-dark text-white rounded-lg text-sm font-medium hover:bg-accent-hover dark:hover:bg-accent-dark-hover disabled:opacity-50 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
