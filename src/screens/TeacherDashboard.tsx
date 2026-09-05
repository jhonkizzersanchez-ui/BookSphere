import type { View } from '../App';

interface Props {
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function TeacherDashboard({ onNavigate }: Props) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
        Class Reading Overview
      </h1>
      <button
        onClick={() => onNavigate('catalog')}
        className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
        style={{ backgroundColor: '#4361EE' }}
      >
        Browse Catalog
      </button>
    </div>
  );
}
