import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Code2,
  Network,
  Database,
  MessageSquare,
  BarChart3,
  Settings as SettingsIcon,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Terminal,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useProgressState } from '../hooks/useProgress';
import { logStudyMinutes } from '../lib/storage';
import { OnboardingModal } from './OnboardingModal';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/learn', label: 'Learn', icon: GraduationCap, end: false },
  { to: '/quiz', label: 'Quizzes', icon: BookOpen, end: false },
  { to: '/code', label: 'Coding', icon: Code2, end: false },
  { to: '/design', label: 'System Design', icon: Network, end: false },
  { to: '/sql', label: 'SQL', icon: Database, end: false },
  { to: '/interview', label: 'Interview Q&A', icon: MessageSquare, end: false },
  { to: '/progress', label: 'Progress', icon: BarChart3, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { settings } = useProgressState();
  const [collapsed, setCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!settings.onboarded);
  const location = useLocation();

  // Study heartbeat: count one minute per active minute on the page.
  useEffect(() => {
    const id = setInterval(() => logStudyMinutes(1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full">
      <aside
        className={`flex flex-col border-r border-border bg-surface transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Terminal className="h-5 w-5 shrink-0 text-primary" />
          {!collapsed && <span className="font-mono text-sm font-semibold">forge</span>}
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-muted hover:bg-surface-2 hover:text-text'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-text"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur">
          <h1 className="font-semibold">Backend Interview Forge</h1>
          <button
            onClick={toggle}
            className="rounded-lg border border-border p-2 text-muted transition hover:text-text"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>
        <main key={location.pathname} className="flex-1 animate-fade-in overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
        <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted">
          Built by Uman Mushtaq — github.com/UmanMushtaq/backend-interview-forge
        </footer>
      </div>

      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
