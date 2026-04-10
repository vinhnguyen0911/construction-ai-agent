import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, LogOut, HardHat, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';

const navItems = [
  { to: '/chat', label: 'Chat AI', icon: MessageSquare },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <aside className="w-[260px] flex flex-col h-full bg-civil-secondary dark:bg-civil-secondary-dark border-r border-civil-border dark:border-civil-border-dark">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-civil-border dark:border-civil-border-dark">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent dark:bg-accent-dark flex items-center justify-center">
            <HardHat className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold text-civil-text dark:text-civil-text-dark">Civil Bot</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-accent-light dark:bg-accent-dark-light text-accent dark:text-accent-dark'
                  : 'text-civil-text-secondary dark:text-civil-text-secondary-dark hover:bg-civil-border/50 dark:hover:bg-civil-border-dark/50'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Footer */}
      <div className="px-3 py-3 border-t border-civil-border dark:border-civil-border-dark">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-civil-text-secondary dark:text-civil-text-secondary-dark truncate">
            {user?.username}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg text-civil-muted dark:text-civil-muted-dark hover:bg-civil-border/50 dark:hover:bg-civil-border-dark/50 transition-colors duration-150"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-civil-muted dark:text-civil-muted-dark hover:text-civil-danger hover:bg-civil-border/50 dark:hover:bg-civil-border-dark/50 transition-colors duration-150"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-civil-bg dark:bg-civil-bg-dark">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-surface dark:bg-surface-dark border border-civil-border dark:border-civil-border-dark shadow-sm"
      >
        <Menu className="w-5 h-5 text-civil-text dark:text-civil-text-dark" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="relative flex-shrink-0">{sidebar}</div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex-1 bg-black/40"
            aria-label="Close sidebar"
          />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
