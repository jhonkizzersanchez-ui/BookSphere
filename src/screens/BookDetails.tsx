import { books, levelColors, genreColors, currentStudent } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  bookId: string;
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  role: 'student' | 'teacher' | 'librarian';
}

function Stars({ rating, large }: { rating: number; large?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={large ? 'text-xl' : 'text-sm'} style={{ color: s <= Math.round(rating) ? '#F9C74F' : '#D8E8EC' }}>★</span>
      ))}
    </div>
  );
}

export default function BookDetails({ bookId, onNavigate, onToast, role }: Props) {
  const book = books.find((b) => b.id === bookId);
  if (!book) {
    return (
      <div className="flex items-center justify-center h-64 text-[#6B8EA0]">
        <div className="text-center">
          <p className="text-5xl mb-3">📭</p>
          <p className="font-semibold">Book not found</p>
          <button onClick={() => onNavigate('catalog')} className="mt-3 text-sm font-semibold" style={{ color: '#2A9D8F' }}>Back to Catalog</button>
        </div>
      </div>
    );
  }

  const lvl = levelColors[book.readingLevel];
  const available = book.borrowedCopies < book.totalCopies;
  const isBorrowed = currentStudent.borrowedBooks.some((r) => r.bookId === book.id);
  const isWishlisted = currentStudent.wishlist.includes(book.id);
  const similar = books.filter((b) => b.id !== book.id && b.genre.some((g) => book.genre.includes(g))).slice(0, 4);

  const handleBorrow = () => {
    if (available) {
      onToast('Book borrowed! Due in 21 days. 📚', 'success');
    } else {
      onToast('Added to your hold list! You\'ll be notified when it\'s available.', 'info');
    }
  };

  const handleWishlist = () => {
    onToast(isWishlisted ? 'Removed from wishlist.' : 'Added to wishlist! 🔖', isWishlisted ? 'info' : 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('catalog')}
        className="flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
        style={{ color: '#6B8EA0' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Catalog
      </button>

      {/* Main info */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <BookCover book={book} size="xl" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: lvl.bg, color: lvl.text, border: `1px solid ${lvl.border}` }}
              >
                {book.readingLevel}
              </span>
              {book.series && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FFF8E0] text-[#C49A00]">
                  Series: {book.series}
                </span>
              )}
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: available ? '#E8F5F3' : '#FEF0EE', color: available ? '#1E7268' : '#C55A3E' }}
              >
                {available ? `✓ Available (${book.totalCopies - book.borrowedCopies}/${book.totalCopies})` : `Out of copies (0/${book.totalCopies})`}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#264653] mb-1" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
              {book.title}
            </h1>
            <p className="text-lg text-[#6B8EA0] mb-3">by {book.author} · {book.yearPublished}</p>

            <div className="flex items-center gap-3 mb-4">
              <Stars rating={book.rating} large />
              <span className="text-2xl font-bold" style={{ color: '#264653', fontFamily: "'Baloo 2', sans-serif" }}>{book.rating.toFixed(1)}</span>
              <span className="text-sm text-[#6B8EA0]">({book.reviewCount} reviews)</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'AR Points', value: book.arPoints ? `${book.arPoints} pts` : '—', color: '#F4A261' },
                { label: 'Lexile Score', value: book.lexile ? `${book.lexile}L` : '—', color: '#4361EE' },
                { label: 'Published', value: book.yearPublished.toString(), color: '#9B5DE5' },
              ].map((s) => (
                <div key={s.label} className="px-3 py-2 rounded-xl" style={{ backgroundColor: `${s.color}12` }}>
                  <p className="text-[10px] font-medium" style={{ color: '#6B8EA0' }}>{s.label}</p>
                  <p className="text-base font-bold" style={{ color: s.color, fontFamily: "'Baloo 2', sans-serif" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {book.genre.map((g) => (
                <span
                  key={g}
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${genreColors[g] ?? '#6B8EA0'}18`, color: genreColors[g] ?? '#6B8EA0' }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-sm leading-relaxed text-[#264653] mb-5">{book.synopsis}</p>

            {/* Action buttons */}
            {role === 'student' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleBorrow}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: isBorrowed ? '#6B8EA0' : available ? '#2A9D8F' : '#F4A261' }}
                >
                  {isBorrowed ? '✓ Currently Reading' : available ? '📚 Borrow Book' : '📋 Join Hold List'}
                </button>
                <button
                  onClick={handleWishlist}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all hover:opacity-80"
                  style={{
                    borderColor: isWishlisted ? '#F4A261' : '#E8EDF0',
                    color: isWishlisted ? '#F4A261' : '#264653',
                    backgroundColor: isWishlisted ? '#FFF3E8' : 'white',
                  }}
                >
                  {isWishlisted ? '🔖 Wishlisted' : '🔖 Add to Wishlist'}
                </button>
              </div>
            )}
            {role === 'teacher' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onToast('Book added to your class reading list!', 'success')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: '#4361EE' }}
                >
                  📋 Add to Class Reading List
                </button>
                <button
                  onClick={() => onToast('Classroom copies requested!', 'success')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6]"
                >
                  📦 Request Classroom Copies
                </button>
              </div>
            )}
            {role === 'librarian' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onToast('Opening edit form…', 'info')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: '#9B5DE5' }}
                >
                  ✏️ Edit Book Record
                </button>
                <button
                  onClick={() => onToast('Processing reservation…', 'info')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6]"
                >
                  📋 Reserve for Student
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] p-6 mb-6">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
          Student Book Talks 💬
        </h2>
        {book.reviews && book.reviews.length > 0 ? (
          <div className="space-y-4">
            {book.reviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: '#2A9D8F' }}
                >
                  {review.studentName.charAt(0)}
                </div>
                <div className="flex-1 bg-[#F5F9FA] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#264653]">{review.studentName}</span>
                    <span className="text-xs text-[#9BB5C0]">Grade {review.grade} · {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-xs" style={{ color: s <= review.rating ? '#F9C74F' : '#D8E8EC' }}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-[#264653] leading-relaxed">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm text-[#6B8EA0]">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        )}
        {role === 'student' && (
          <button
            onClick={() => onToast('Review submitted! Thanks for sharing. ⭐', 'success')}
            className="mt-4 w-full py-2.5 rounded-xl border-2 border-dashed border-[#D8E8EC] text-sm font-medium text-[#6B8EA0] hover:border-[#2A9D8F] hover:text-[#2A9D8F] transition-all"
          >
            + Write a Book Talk review
          </button>
        )}
      </div>

      {/* Similar books */}
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
          More Books Like This ✨
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {similar.map((b) => {
            const l = levelColors[b.readingLevel];
            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-md transition-all hover:border-[#2A9D8F]/30"
                onClick={() => onNavigate('book-details', b.id)}
              >
                <BookCover book={b} size="md" className="w-full mb-2" />
                <p className="text-sm font-bold text-[#264653] leading-tight line-clamp-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{b.title}</p>
                <p className="text-xs text-[#6B8EA0] mt-0.5">{b.author}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex gap-0.5">
                    <span className="text-xs" style={{ color: '#F9C74F' }}>★</span>
                    <span className="text-xs font-semibold text-[#264653]">{b.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: l.bg, color: l.text }}>
                    {b.readingLevel.replace('Grades ', 'Gr ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
