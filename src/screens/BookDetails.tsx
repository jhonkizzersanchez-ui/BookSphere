import { books, levelColors, genreColors } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  bookId?: string;
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-lg" style={{ color: s <= Math.round(rating) ? '#F9C74F' : '#D8E8EC' }}>★</span>
      ))}
    </div>
  );
}

export default function BookDetails({ bookId, onNavigate, onToast }: Props) {
  const book = books.find((b) => b.id === bookId);

  if (!book) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[#6B8EA0]">Book not found.</p>
        <button className="text-sm font-semibold mt-2" style={{ color: '#2A9D8F' }} onClick={() => onNavigate('catalog')}>
          Back to catalog
        </button>
      </div>
    );
  }

  const available = book.borrowedCopies < book.totalCopies;
  const availableCopies = book.totalCopies - book.borrowedCopies;
  const lvl = levelColors[book.readingLevel];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        className="text-xs font-semibold mb-4"
        style={{ color: '#6B8EA0' }}
        onClick={() => onNavigate('catalog')}
      >
        ← Back to catalog
      </button>

      <div className="flex flex-col sm:flex-row gap-8">
        <BookCover book={book} size="xl" className="mx-auto sm:mx-0 flex-shrink-0" />

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: lvl.bg, color: lvl.text, border: `1px solid ${lvl.border}` }}
            >
              {book.readingLevel}
            </span>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                backgroundColor: available ? '#E8F5F3' : '#F5F7F8',
                color: available ? '#1E7268' : '#9BB5C0',
              }}
            >
              {available ? `✓ Available (${availableCopies}/${book.totalCopies})` : 'All copies checked out'}
            </span>
          </div>

          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
            {book.title}
          </h1>
          <p className="text-base text-[#6B8EA0]">
            by {book.author} · {book.yearPublished}
          </p>

          <div className="flex items-center gap-3">
            <StarRating rating={book.rating} />
            <span className="text-xl font-bold" style={{ color: '#264653' }}>{book.rating.toFixed(1)}</span>
            {book.reviewCount !== undefined && (
              <span className="text-sm" style={{ color: '#9BB5C0' }}>({book.reviewCount} reviews)</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            {book.arPoints !== undefined && (
              <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#FFF3E8' }}>
                <p className="text-xs" style={{ color: '#6B8EA0' }}>AR Points</p>
                <p className="text-lg font-bold" style={{ color: '#F4A261' }}>{book.arPoints} pts</p>
              </div>
            )}
            {book.lexile !== undefined && (
              <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#EAF0FF' }}>
                <p className="text-xs" style={{ color: '#6B8EA0' }}>Lexile Score</p>
                <p className="text-lg font-bold" style={{ color: '#3A4FBF' }}>{book.lexile}L</p>
              </div>
            )}
            <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#F5EAFB' }}>
              <p className="text-xs" style={{ color: '#6B8EA0' }}>Published</p>
              <p className="text-lg font-bold" style={{ color: '#7A3FA0' }}>{book.yearPublished}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {book.genre.map((g) => {
              const color = genreColors[g] ?? '#6B8EA0';
              return (
                <span
                  key={g}
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {g}
                </span>
              );
            })}
          </div>

          {book.summary && (
            <p className="text-base leading-relaxed" style={{ color: '#264653' }}>
              {book.summary}
            </p>
          )}

          <button
            disabled={!available}
            onClick={() => onToast(`"${book.title}" borrowed!`, 'success')}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: '#2A9D8F' }}
          >
            Borrow this book
          </button>
        </div>
      </div>

      <button
        onClick={() => onToast('A librarian will be with you shortly.', 'info')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl text-white transition-transform hover:scale-105"
        style={{ backgroundColor: '#264653' }}
        aria-label="Ask a librarian"
      >
        💬
      </button>
    </div>
  );
}
