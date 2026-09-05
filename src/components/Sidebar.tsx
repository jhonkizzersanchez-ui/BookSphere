import type { Role, View } from '../App';

interface SidebarProps {
  role: Role;
  view: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
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

const homeViewFor: Record<Role, View> = {
  student: 'student-dashboard',
  teacher: 'teacher-dashboard',
  librarian: 'librarian-panel',
};

function navItemsFor(role: Role): { view: View; label: string; emoji: string }[] {
  return [
    { view: homeViewFor[role], label: 'Dashboard', emoji: '🏠' },
    { view: 'catalog', label: 'Catalog', emoji: '📚' },
    { view: 'my-books', label: 'My Books', emoji: '🔖' },
    { view: 'search-result', label: 'Search', emoji: '🔍' },
  ];
}

export default function Sidebar({ role, view, onNavigate, onLogout }: SidebarProps) {
  const navItems = navItemsFor(role);

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-56 flex flex-col border-r border-[#E8EDF0] overflow-y-auto"
      style={{ backgroundColor: '#FDFBF7' }}
    >
      <div className="px-4 pt-5 pb-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#2A9D8F' }}>
          📚
        </div>
        <span className="text-lg font-bold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          <span style={{ color: '#2A9D8F' }}>Book</span>
          <span style={{ color: '#F4A261' }}>Sphere</span>
        </span>
      </div>

      <div className="px-4 pt-4 pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#9BB5C0' }}>
          {roleLabels[role]}
        </span>
      </div>

      <nav className="px-2 space-y-1">
        {navItems.map((item) => {
          const active = view === item.view;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                backgroundColor: active ? '#E8F5F3' : 'transparent',
                color: active ? '#2A9D8F' : '#264653',
              }}
            >
              <span className="text-lg">{item.emoji}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mx-4 my-3 border-t border-[#E8EDF0]" />

      <div className="px-4 pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#9BB5C0' }}>
          Quick Actions
        </span>
      </div>
      <nav className="px-2 space-y-1">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#F0F4F6]"
          style={{ color: '#264653' }}
        >
          <span className="text-lg">❓</span>
          Ask Librarian
        </button>
      </nav>

      <div className="flex-1" />

      <div className="mx-4 mb-3 border-t border-[#E8EDF0]" />

      <button
        onClick={onLogout}
        className="mx-2 mb-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F0F4F6]"
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: roleColors[role] }}
        >
          {roleInitials[role]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight truncate" style={{ color: '#264653' }}>{roleNames[role]}</p>
          <p className="text-xs leading-tight" style={{ color: '#9BB5C0' }}>{roleLabels[role]}</p>
        </div>
      </button>
    </aside>
  );
}
