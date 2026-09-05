import type { View } from '../App';

interface Props {
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function MyBooks({ onNavigate }: Props) {
  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
        My Books
      </h1>
      <p className="text-sm text-[#6B8EA0] mt-2">You have no borrowed books yet.</p>
      <button className="text-sm font-semibold mt-3" style={{ color: '#2A9D8F' }} onClick={() => onNavigate('catalog')}>
        Browse the catalog
      </button>
    </div>
  );
}
