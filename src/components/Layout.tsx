import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Flame,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
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
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useProgressState } from '../hooks/useProgress';
import { logStudyMinutes } from '../lib/storage';
import { computeStreaks } from '../lib/scoring';
import { COURSES, courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import { courseProgress, overallChapterProgress, readSetFor } from '../lib/courses';
import { OnboardingModal } from './OnboardingModal';

const PRACTICE = [
  { to: '/code', label: 'Coding', icon: Code2 },
  { to: '/design', label: 'System Design', icon: Network },
  { to: '/sql', label: 'SQL', icon: Database },
  { to: '/interview', label: 'Interview Q&A', icon: MessageSquare },
];

const ACCOUNT = [
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const SECTION_LABELS: Record<string, string> = {
  code: 'Coding',
  design: 'System Design',
  sql: 'SQL',
  interview: 'Interview Q&A',
  progress: 'Progress',
  settings: 'Settings',
  quiz: 'Quizzes',
  learn: 'Learn',
};

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
    isActive ? 'bg-primary/15 font-medium text-primary' : 'text-muted hover:bg-surface-2 hover:text-text'
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const state = useProgressState();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(!state.settings.onboarded);

  // Study heartbeat: count one minute per active minute on the page.
  useEffect(() => {
    const id = setInterval(() => logStudyMinutes(1), 60_000);
    return () => clearInterval(id);
  }, []);

  const activeCourseId = location.pathname.match(/^\/courses\/([^/]+)/)?.[1] ?? null;
  const activeChapterId = location.pathname.match(/^\/courses\/[^/]+\/([^/]+)/)?.[1] ?? null;

  // Auto-expand the course you're currently inside.
  useEffect(() => {
    if (activeCourseId) {
      setExpanded((prev) => (prev.has(activeCourseId) ? prev : new Set(prev).add(activeCourseId)));
    }
  }, [activeCourseId]);

  const overall = overallChapterProgress(state);
  const streak = computeStreaks(state.studyHistory).current;

  const breadcrumb = useMemo(() => {
    const seg = location.pathname.split('/').filter(Boolean);
    if (seg.length === 0) return ['Dashboard'];
    const [root, a, b] = seg;
    if (root === 'courses') {
      const crumbs = ['Courses'];
      if (a) crumbs.push(courseConfigById[a]?.title ?? a);
      if (b) crumbs.push(moduleById[a]?.lessons.find((l) => l.id === b)?.title ?? b);
      return crumbs;
    }
    if (root === 'learn') {
      const crumbs = ['Learn'];
      if (a) crumbs.push(moduleById[a]?.title ?? a);
      return crumbs;
    }
    const label = SECTION_LABELS[root] ?? root.charAt(0).toUpperCase() + root.slice(1);
    return a ? [label, a] : [label];
  }, [location.pathname]);

  function toggleCourse(courseId: string) {
    const isOpen = expanded.has(courseId);
    if (isOpen && activeCourseId === courseId) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    } else {
      setExpanded((prev) => new Set(prev).add(courseId));
      navigate(`/courses/${courseId}`);
    }
  }

  return (
    <div className="flex h-full">
      <aside
        className={`flex flex-col border-r border-border bg-surface transition-all duration-200 ${
          collapsed ? 'w-14' : 'w-64'
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex h-14 items-center gap-2 border-b border-border px-4">
          <GraduationCap className="h-6 w-6 shrink-0 text-primary" />
          {!collapsed && <span className="font-semibold tracking-tight">Backend Forge</span>}
        </Link>

        <nav className="flex-1 space-y-5 overflow-y-auto p-2">
          {/* Courses */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Courses</p>
            )}
            <div className="space-y-0.5">
              {COURSES.map((course) => {
                const Icon = course.icon;
                const isActiveCourse = activeCourseId === course.id;
                const isOpen = expanded.has(course.id) && !collapsed;
                const prog = courseProgress(course.id, state);

                if (collapsed) {
                  return (
                    <NavLink
                      key={course.id}
                      to={`/courses/${course.id}`}
                      title={course.title}
                      className={navItemClass}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${course.color}`} />
                    </NavLink>
                  );
                }

                return (
                  <div key={course.id}>
                    <button
                      onClick={() => toggleCourse(course.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        isActiveCourse
                          ? 'bg-primary/10 font-medium text-text'
                          : 'text-muted hover:bg-surface-2 hover:text-text'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${course.color}`} />
                      <span className="flex-1 truncate text-left">{course.title}</span>
                      {prog.read > 0 && (
                        <span className="text-[10px] tabular-nums text-muted">
                          {prog.read}/{prog.total}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="mb-1 ml-4 space-y-0.5 border-l border-border pl-2 animate-slide-down">
                        {(moduleById[course.id]?.lessons ?? []).map((lesson, i) => {
                          const read = readSetFor(course.id, state).has(lesson.id);
                          const isActiveChapter = isActiveCourse && activeChapterId === lesson.id;
                          return (
                            <NavLink
                              key={lesson.id}
                              to={`/courses/${course.id}/${lesson.id}`}
                              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ${
                                isActiveChapter
                                  ? 'bg-primary/15 font-medium text-primary'
                                  : 'text-muted hover:bg-surface-2 hover:text-text'
                              }`}
                            >
                              {read ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 shrink-0 text-muted/50" />
                              )}
                              <span className="truncate">
                                {i + 1}. {lesson.title}
                              </span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practice */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Practice</p>
            )}
            <div className="space-y-0.5">
              {PRACTICE.map((item) => (
                <NavLink key={item.to} to={item.to} title={item.label} className={navItemClass}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Account</p>
            )}
            <div className="space-y-0.5">
              {ACCOUNT.map((item) => (
                <NavLink key={item.to} to={item.to} title={item.label} className={navItemClass}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom: progress, streak, collapse toggle */}
        <div className="border-t border-border p-3">
          {!collapsed ? (
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Overall progress</span>
                <span className="tabular-nums">
                  {overall.read}/{overall.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${overall.percent}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-medium text-text">{streak}</span>
                <span>day streak</span>
              </div>
            </div>
          ) : (
            <div className="mb-2 flex flex-col items-center gap-1 text-xs text-muted">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-text">{streak}</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-text"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Thin top header with breadcrumb + theme toggle */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-5 backdrop-blur">
          <nav className="flex items-center gap-1.5 truncate text-sm">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted/50">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'font-medium text-text' : 'text-muted'}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
          <button
            onClick={toggle}
            className="rounded-lg border border-border p-1.5 text-muted transition hover:text-text"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        <main key={location.pathname} className="flex-1 animate-fade-in overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>

      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
