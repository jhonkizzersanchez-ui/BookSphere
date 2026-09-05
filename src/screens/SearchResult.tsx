import { useMemo } from 'react';
import { books } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  query: string;
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function SearchResult({ query, onNavigate }: Props) {
  const results = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return [];
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.genre.some((g) => g.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
        Results for "{query}"
      </h1>
      {results.length === 0 ? (
        <p className="text-sm text-[#6B8EA0]">No books matched your search.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((book) => (
            <div
              key={book.id}
              className="cursor-pointer flex flex-col items-center gap-2"
              onClick={() => onNavigate('book-details', book.id)}
            >
              <BookCover book={book} size="md" />
              <p className="text-xs font-semibold text-center text-[#264653] line-clamp-2">{book.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
