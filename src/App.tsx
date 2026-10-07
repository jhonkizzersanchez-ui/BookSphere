import { useState, useEffect } from 'react';
import Login from './screens/Login';
import StudentDashboard from './screens/StudentDashboard';
import BookCatalog from './screens/BookCatalog';
import BookDetails from './screens/BookDetails';
import MyBooks from './screens/MyBooks';
import TeacherDashboard from './screens/TeacherDashboard';
import LibrarianPanel from './screens/LibrarianPanel';
import SearchResults from './screens/SearchResults';
import Navbar from './components/Navbar';
import { auth, ApiError } from './lib/auth';
import type { AuthUser } from './lib/auth';

export type Role = 'student' | 'teacher' | 'librarian';
export type View =
  | 'login'
  | 'student-dashboard'
  | 'catalog'
  | 'book-details'
  | 'my-books'
  | 'teacher-dashboard'
  | 'librarian-panel'
  | 'search';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface NavItem {
  view: View;
  label: string;
  emoji: string;
  mobileEmoji: string;
}

const studentNav: NavItem[] = [
  { view: 'student-dashboard', label: 'Dashboard', emoji: '🏠', mobileEmoji: '🏠' },
  { view: 'catalog', label: 'Catalog', emoji: '📚', mobileEmoji: '📚' },
  { view: 'my-books', label: 'My Books', emoji: '🔖', mobileEmoji: '🔖' },
  { view: 'search', label: 'Search', emoji: '🔍', mobileEmoji: '🔍' },
];

const teacherNav: NavItem[] = [
  { view: 'teacher-dashboard', label: 'Dashboard', emoji: '🏠', mobileEmoji: '🏠' },
  { view: 'catalog', label: 'Catalog', emoji: '📚', mobileEmoji: '📚' },
  { view: 'search', label: 'Search', emoji: '🔍', mobileEmoji: '🔍' },
];

const librarianNav: NavItem[] = [
  { view: 'librarian-panel', label: 'Dashboard', emoji: '🏠', mobileEmoji: '🏠' },
  { view: 'catalog', label: 'Catalog', emoji: '📚', mobileEmoji: '📚' },
  { view: 'search', label: 'Search', emoji: '🔍', mobileEmoji: '🔍' },
];

const navByRole: Record<Role, NavItem[]> = {
  student: studentNav,
  teacher: teacherNav,
  librarian: librarianNav,
};

const roleAccent: Record<Role, string> = {
  student: '#2A9D8F',
  teacher: '#4361EE',
  librarian: '#9B5DE5',
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const role = user?.role ?? null;
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [view, setView] = useState<View>('login');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('reset_token')) {
      setAuthLoaded(true);
      return;
    }
    let cancelled = false;
    auth.currentUser().then(account => {
      if (cancelled) return;
      setUser(account);
      if (account) setView(account.role === 'student' ? 'student-dashboard' : account.role === 'teacher' ? 'teacher-dashboard' : 'librarian-panel');
    }).catch(error => {
      if (!cancelled) setAuthError(error instanceof Error ? error.message : 'Unable to check your session.');
    }).finally(() => { if (!cancelled) setAuthLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const expire = () => { setUser(null); setView('login'); setSelectedBookId(null); setSearchQuery(''); };
    window.addEventListener('booksphere-session-expired', expire);
    return () => window.removeEventListener('booksphere-session-expired', expire);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [view]);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const login = (account: AuthUser) => {
    const selectedRole = account.role;
    setUser(account);
    if (selectedRole === 'student') setView('student-dashboard');
    else if (selectedRole === 'teacher') setView('teacher-dashboard');
    else setView('librarian-panel');
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        addToast(error instanceof Error ? error.message : 'Unable to sign out. Try again.', 'warning');
        return;
      }
    } finally {
      setLoggingOut(false);
    }
    setUser(null);
    setView('login');
    setSelectedBookId(null);
    setSearchQuery('');
    setToasts([]);
  };

  const navigate = (newView: View, bookId?: string) => {
    setView(newView);
    if (bookId) setSelectedBookId(bookId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setView('search');
  };

  if (!authLoaded || authError) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-6">
      <div className="max-w-md text-center text-[#264653]">
        <p>{authError || 'Checking your session…'}</p>
        {authError && <button className="mt-4 px-5 py-2 rounded-xl bg-[#2A9D8F] text-white" onClick={() => window.location.reload()}>Try again</button>}
      </div>
    </div>;
  }

  if (view === 'login' || !user) {
    return <Login onLogin={login} />;
  }

  const navItems = navByRole[role!];
  const accent = roleAccent[role!];

  const isLibrarianFullLayout = role === 'librarian' && view === 'librarian-panel';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Top Navbar */}
      <Navbar
        user={user}
        loggingOut={loggingOut}
        role={role!}
        view={view}
        onNavigate={navigate}
        onLogout={logout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Layout */}
      <div className="flex" style={{ paddingTop: '64px' }}>
        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 border-r border-[#E8EDF0] bg-white sticky overflow-y-auto"
          style={{ width: '220px', top: '64px', height: 'calc(100vh - 64px)' }}
        >
          <nav className="p-3 flex flex-col gap-1 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: '#9BB5C0' }}>
              {role === 'student' ? 'Student' : role === 'teacher' ? 'Teacher' : 'Librarian'}
            </p>
            {navItems.map((item) => {
              const isActive = view === item.view || (item.view === 'search' && view === 'search');
              return (
                <button
                  key={item.view}
                  onClick={() => navigate(item.view)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full"
                  style={{
                    backgroundColor: isActive ? `${accent}15` : 'transparent',
                    color: isActive ? accent : '#264653',
                  }}
                >
                  <span className="text-base">{item.emoji}</span>
                  {item.label}
                </button>
              );
            })}

            {/* Role-specific extras */}
            {role === 'student' && (
              <>
                <div className="mt-2 mb-1 border-t border-[#E8EDF0]" />
                <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1" style={{ color: '#9BB5C0' }}>Quick Actions</p>
                <button
                  onClick={() => { addToast('Check with the librarian at the front desk!', 'info'); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full text-[#264653] hover:bg-[#F0F4F6]"
                >
                  <span>❓</span> Ask Librarian
                </button>
              </>
            )}

            {role === 'librarian' && (
              <>
                <div className="mt-2 mb-1 border-t border-[#E8EDF0]" />
                <button
                  onClick={() => { addToast('Opening help documentation…', 'info'); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#264653] hover:bg-[#F0F4F6] transition-all text-left w-full"
                >
                  <span>📦</span> Pending Requests
                  <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#FFF3E8] text-[#F4A261]">2</span>
                </button>
              </>
            )}
          </nav>

          {/* Bottom of sidebar */}
          <div className="p-4 border-t border-[#E8EDF0]">
            <div className="flex items-center gap-2 px-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: accent }}
              >
                {user.name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#264653] truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-[#9BB5C0] capitalize">{role}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-30 md:hidden"
              style={{ backgroundColor: 'rgba(38, 70, 83, 0.3)', top: '64px' }}
              onClick={() => setSidebarOpen(false)}
            />
            <div
              className="fixed left-0 z-40 md:hidden bg-white border-r border-[#E8EDF0] flex flex-col"
              style={{ top: '64px', bottom: 0, width: '220px' }}
            >
              <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = view === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => { navigate(item.view); setSidebarOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full"
                      style={{
                        backgroundColor: isActive ? `${accent}15` : 'transparent',
                        color: isActive ? accent : '#264653',
                      }}
                    >
                      <span className="text-base">{item.emoji}</span>
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        )}

        {/* Main content */}
        <main
          className={`flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-6 ${isLibrarianFullLayout ? 'p-0' : ''}`}
        >
          {view === 'student-dashboard' && role === 'student' && (
            <StudentDashboard userName={user.name} onNavigate={navigate} onToast={addToast} />
          )}
          {view === 'catalog' && (
            <BookCatalog onNavigate={navigate} onToast={addToast} />
          )}
          {view === 'book-details' && selectedBookId && (
            <BookDetails bookId={selectedBookId} onNavigate={navigate} onToast={addToast} role={role!} />
          )}
          {view === 'my-books' && role === 'student' && (
            <MyBooks onNavigate={navigate} onToast={addToast} />
          )}
          {view === 'teacher-dashboard' && role === 'teacher' && (
            <TeacherDashboard userName={user.name} onNavigate={navigate} onToast={addToast} />
          )}
          {view === 'librarian-panel' && role === 'librarian' && (
            <LibrarianPanel onNavigate={navigate} onToast={addToast} />
          )}
          {view === 'search' && (
            <SearchResults
              query={searchQuery}
              onNavigate={navigate}
              onToast={addToast}
              onSearch={handleSearch}
              setSearchQuery={setSearchQuery}
            />
          )}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 border-t border-[#E8EDF0] flex"
        style={{ backgroundColor: '#FDFBF7', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const isActive = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all"
              style={{ color: isActive ? accent : '#9BB5C0' }}
            >
              <span className="text-xl">{item.mobileEmoji}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast notifications */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const icons = { success: '✅', info: 'ℹ️', warning: '⚠️' };
          const colors = {
            success: { bg: '#E8F8F0', border: '#A8D8BC', text: '#1E7A50' },
            info: { bg: '#EEF0FD', border: '#B4BCEF', text: '#2B47CE' },
            warning: { bg: '#FFF3E8', border: '#F4C08A', text: '#B56120' },
          };
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto max-w-xs"
              style={{ backgroundColor: c.bg, borderColor: c.border }}
            >
              <span className="text-sm flex-shrink-0">{icons[toast.type]}</span>
              <p className="text-xs font-semibold" style={{ color: c.text }}>{toast.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
