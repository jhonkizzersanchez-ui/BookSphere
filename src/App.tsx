import { useState } from 'react';
import Sidebar from './components/Sidebar';
import BookCatalog from './screens/BookCatalog';
import BookDetails from './screens/BookDetails';
import Login from './screens/Login';
import MyBooks from './screens/MyBooks';
import SearchResult from './screens/SearchResult';
import StudentDashboard from './screens/StudentDashboard';
import TeacherDashboard from './screens/TeacherDashboard';
import LibrarianPanel from './screens/LibrarianPanel';

export type Role = 'student' | 'teacher' | 'librarian';

export type View =
  | 'login'
  | 'catalog'
  | 'book-details'
  | 'my-books'
  | 'search-result'
  | 'student-dashboard'
  | 'teacher-dashboard'
  | 'librarian-panel';

interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'info' | 'warning';
}

function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [view, setView] = useState<View>('login');
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>();
  const [searchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const navigate = (next: View, bookId?: string) => {
    setSelectedBookId(bookId);
    setView(next);
  };

  const handleLogin = (nextRole: Role) => {
    setRole(nextRole);
    const home: View =
      nextRole === 'student' ? 'student-dashboard' : nextRole === 'teacher' ? 'teacher-dashboard' : 'librarian-panel';
    navigate(home);
  };

  const handleLogout = () => {
    setRole(null);
    setView('login');
  };

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Sidebar role={role} view={view} onNavigate={navigate} onLogout={handleLogout} />
      <main className="pl-56">
        {view === 'catalog' && (
          <BookCatalog onNavigate={navigate} onToast={showToast} initialQuery={searchQuery} />
        )}
        {view === 'book-details' && (
          <BookDetails bookId={selectedBookId} onNavigate={navigate} onToast={showToast} />
        )}
        {view === 'my-books' && <MyBooks onNavigate={navigate} onToast={showToast} />}
        {view === 'search-result' && (
          <SearchResult query={searchQuery} onNavigate={navigate} onToast={showToast} />
        )}
        {view === 'student-dashboard' && <StudentDashboard onNavigate={navigate} onToast={showToast} />}
        {view === 'teacher-dashboard' && <TeacherDashboard onNavigate={navigate} onToast={showToast} />}
        {view === 'librarian-panel' && <LibrarianPanel onNavigate={navigate} onToast={showToast} />}
      </main>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2 rounded-xl shadow-lg text-sm font-medium text-white"
            style={{
              backgroundColor: t.type === 'success' ? '#2A9D8F' : t.type === 'warning' ? '#E76F51' : '#264653',
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
