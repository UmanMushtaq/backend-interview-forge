import { useEffect, useMemo, useState, useCallback } from 'react';
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
  BrainCircuit,
  Search,
  Bookmark,
  Menu,
  X,
  Building2,
  FileText,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useProgressState } from '../hooks/useProgress';
import { logStudyMinutes } from '../lib/storage';
import { computeStreaks } from '../lib/scoring';
import { COURSES, courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import { courseProgress, overallChapterProgress, readSetFor } from '../lib/courses';
import { OnboardingModal } from './OnboardingModal';
import { GlobalSearch } from './GlobalSearch';

const PRACTICE = [
  { to: '/code', label: 'Coding', icon: Code2 },
  { to: '/design', label: 'System Design', icon: Network },
  { to: '/sql', label: 'SQL', icon: Database },
  { to: '/interview-simulator', label: 'Interview Simulator', icon: BrainCircuit },
  { to: '/interview', label: 'Interview Q&A', icon: MessageSquare },
  { to: '/companies', label: 'Companies', icon: Building2 },
];

const ACCOUNT = [
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/cv-assistant', label: 'CV Assistant', icon: FileText },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const SECTION_LABELS: Record<string, string> = {
  code: 'Coding',
  design: 'System Design',
  sql: 'SQL',
  interview: 'Interview Q&A',
  'interview-simulator': 'Interview Simulator',
  progress: 'Progress',
  settings: 'Settings',
  quiz: 'Quizzes',
  learn: 'Learn',
  companies: 'Companies',
  'cv-assistant': 'CV Assistant',
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Study heartbeat: count one minute per active minute on the page.
  useEffect(() => {
    const id = setInterval(() => logStudyMinutes(1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Cmd+K / Ctrl+K global search shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const activeCourseId = location.pathname.match(/^\/courses\/([^/]+)/)?.[1] ?? null;
  const activeChapterId = location.pathname.match(/^\/courses\/[^/]+\/([^/]+)/)?.[1] ?? null;

  // Auto-expand the course you're currently inside.
  useEffect(() => {
    if (activeCourseId) {
      setExpanded((prev) => (prev.has(activeCourseId) ? prev : new Set(prev).add(activeCourseId)));
    }
  }, [activeCourseId]);

  const overall = overallChapterProgress(state);
  const streakInfo = computeStreaks(state.studyHistory);
  const streak = streakInfo.current;
  const longestStreak = streakInfo.best;

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

  const sidebarContent = (
    <>
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
            <div
              className={`flex items-center gap-1.5 text-xs ${streak > 0 ? 'text-amber-400' : 'text-muted'}`}
              title={`Longest streak: ${longestStreak} days`}
            >
              <Flame className={`h-3.5 w-3.5 ${streak > 0 ? 'text-amber-400' : 'text-muted/40'}`} />
              {streak === 0 ? (
                <span>No streak yet</span>
              ) : streak === 1 ? (
                <span>1 day streak</span>
              ) : (
                <>
                  <span className="font-bold">{streak}</span>
                  <span> day streak 🔥</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            className="mb-2 flex flex-col items-center gap-1 text-xs"
            title={`${streak > 0 ? `${streak} day streak` : 'No streak yet'} · Longest: ${longestStreak} days`}
          >
            <Flame className={`h-4 w-4 ${streak > 0 ? 'text-amber-400' : 'text-muted/40'}`} />
            <span className={`font-bold ${streak > 0 ? 'text-amber-400' : 'text-muted'}`}>{streak}</span>
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
    </>
  );

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface md:hidden">
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 shrink-0 text-primary" />
              <span className="font-semibold tracking-tight">Backend Forge</span>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="text-muted hover:text-text">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto p-2">
            <div>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Courses</p>
              <div className="space-y-0.5">
                {COURSES.map((course) => {
                  const Icon = course.icon;
                  const isActiveCourse = activeCourseId === course.id;
                  const isOpen = expanded.has(course.id);
                  const prog = courseProgress(course.id, state);
                  return (
                    <div key={course.id}>
                      <button
                        onClick={() => toggleCourse(course.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                          isActiveCourse ? 'bg-primary/10 font-medium text-text' : 'text-muted hover:bg-surface-2 hover:text-text'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${course.color}`} />
                        <span className="flex-1 truncate text-left">{course.title}</span>
                        {prog.read > 0 && (
                          <span className="text-[10px] tabular-nums text-muted">{prog.read}/{prog.total}</span>
                        )}
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />}
                      </button>
                      {isOpen && (
                        <div className="mb-1 ml-4 space-y-0.5 border-l border-border pl-2">
                          {(moduleById[course.id]?.lessons ?? []).map((lesson, i) => {
                            const isRead = readSetFor(course.id, state).has(lesson.id);
                            const isCurrent = isActiveCourse && activeChapterId === lesson.id;
                            return (
                              <NavLink
                                key={lesson.id}
                                to={`/courses/${course.id}/${lesson.id}`}
                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ${
                                  isCurrent ? 'bg-primary/15 font-medium text-primary' : 'text-muted hover:bg-surface-2 hover:text-text'
                                }`}
                              >
                                {isRead ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> : <Circle className="h-3.5 w-3.5 shrink-0 text-muted/50" />}
                                <span className="truncate">{i + 1}. {lesson.title}</span>
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
            <div>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Practice</p>
              <div className="space-y-0.5">
                {PRACTICE.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navItemClass}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
            <div>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Account</p>
              <div className="space-y-0.5">
                {ACCOUNT.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navItemClass}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        </aside>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden flex-col border-r border-border bg-surface transition-all duration-200 md:flex ${
          collapsed ? 'w-14' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Thin top header with breadcrumb + actions */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-border p-1.5 text-muted transition hover:text-text md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
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
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openSearch}
              className="rounded-lg border border-border p-1.5 text-muted transition hover:text-text"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={toggle}
              className="rounded-lg border border-border p-1.5 text-muted transition hover:text-text"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main key={location.pathname} className="flex-1 animate-fade-in overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>

      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      <GlobalSearch open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
