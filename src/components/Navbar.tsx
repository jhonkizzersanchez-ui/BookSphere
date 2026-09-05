import { useState } from 'react';
import type { Role, View } from '../App';

interface NavbarProps {
  role: Role;
  view: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: (q: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const roleColors: Record<Role, string> = {
  student: '#2A9D8F',
  teacher: '#4361EE',
  librarian: '#9B5DE5',
};

const roleLabels: Record<Role, string> = {
  student: 'Student',
  teacher: 'Teacher',
  librarian: 'Librarian',
};

const roleInitials: Record<Role, string> = {
  student: 'AR',
  teacher: 'Ms. C',
  librarian: 'Lib',
};

const roleNames: Record<Role, string> = {
  student: 'Alex Rivera',
  teacher: 'Ms. Chen',
  librarian: 'Mr. Okafor',
};

export default function Navbar({
  role,
  view,
  onNavigate,
  onLogout,
  searchQuery,
  setSearchQuery,
  onSearch,
  sidebarOpen,
  setSidebarOpen,
}: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) onSearch(searchQuery.trim());
  };

  const homeView: View =
    role === 'student' ? 'student-dashboard' : role === 'teacher' ? 'teacher-dashboard' : 'librarian-panel';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 gap-3 border-b border-[#E8EDF0]"
      style={{ backgroundColor: '#FDFBF7' }}
    >
      {/* Hamburger (mobile) */}
      <button
        className="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-[#E8F5F3] transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="#264653" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {/* Logo */}
      <button
        className="flex items-center gap-2 flex-shrink-0 group"
        onClick={() => onNavigate(homeView)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: '#2A9D8F' }}>
          📚
        </div>
        <span className="hidden sm:block text-xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          <span style={{ color: '#2A9D8F' }}>Book</span>
          <span style={{ color: '#F4A261' }}>Sphere</span>
        </span>
      </button>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="#6B8EA0" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="#6B8EA0" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books, authors, genres…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] placeholder:text-[#9BB5C0] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BB5C0] hover:text-[#264653]"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Catalog shortcut (desktop) */}
      <button
        onClick={() => onNavigate('catalog')}
        className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'catalog' ? 'bg-[#E8F5F3] text-[#2A9D8F]' : 'text-[#264653] hover:bg-[#F0F4F6]'}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Catalog
      </button>

      {/* User menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#F0F4F6] transition-colors"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: roleColors[role] }}
          >
            {roleInitials[role]}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#264653] leading-tight">{roleNames[role]}</p>
            <p className="text-[10px] text-[#6B8EA0] leading-tight">{roleLabels[role]}</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="hidden sm:block text-[#6B8EA0]">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {userMenuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border border-[#E8EDF0] py-1 z-50"
            style={{ backgroundColor: '#FDFBF7' }}
          >
            <div className="px-4 py-2 border-b border-[#E8EDF0]">
              <p className="text-sm font-semibold text-[#264653]">{roleNames[role]}</p>
              <p className="text-xs text-[#6B8EA0]">{roleLabels[role]}</p>
            </div>
            <button
              onClick={() => { setUserMenuOpen(false); onLogout(); }}
              className="w-full text-left px-4 py-2 text-sm text-[#E76F51] hover:bg-[#FEF0EE] transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
