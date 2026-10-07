import { books, currentStudent, levelColors } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  userName: string;
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-xs" style={{ color: s <= Math.round(rating) ? '#F9C74F' : '#D8E8EC' }}>★</span>
      ))}
    </div>
  );
}

function DueDateBadge({ dueDate }: { dueDate: string }) {
  const due = new Date(dueDate);
  const today = new Date('2024-03-23');
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF0EE', color: '#E76F51' }}>Overdue</span>;
  if (diff <= 3) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF8E0', color: '#C49A00' }}>Due in {diff}d ⚠️</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E8F8F0', color: '#2D7A50' }}>Due {diff > 14 ? dueDate : `in ${diff}d`}</span>;
}

export default function StudentDashboard({ onNavigate, userName }: Props) {
  const borrowed = currentStudent.borrowedBooks.map((r) => ({ record: r, book: books.find((b) => b.id === r.bookId)! })).filter((x) => x.book);
  const recommended = books.filter((b) => b.readingLevel === currentStudent.readingLevel && !currentStudent.borrowedBooks.find((r) => r.bookId === b.id)).slice(0, 6);
  const earnedBadges = currentStudent.badges.filter((b) => b.earned);
  const today = new Date('2024-03-23');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2A9D8F 0%, #1E7268 100%)' }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 flex items-center justify-end pr-4">
          <span className="text-9xl">📚</span>
        </div>
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
            Hi, {userName.split(' ')[0]}! Ready to read? 📖
          </h1>
          <p className="text-white/80 text-sm">Grade 7 · {currentStudent.class} · Reading Level: Grades 6–8</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Books Read', value: currentStudent.booksReadThisYear, sub: 'this school year', emoji: '📗', color: '#2A9D8F', bg: '#E8F5F3' },
          { label: 'Reading Streak', value: `${currentStudent.readingStreak}`, sub: 'days in a row', emoji: '🔥', color: '#E76F51', bg: '#FEF0EE' },
          { label: 'Badges Earned', value: earnedBadges.length, sub: `of ${currentStudent.badges.length} total`, emoji: '🏅', color: '#F4A261', bg: '#FFF3E8' },
          { label: 'Books Borrowed', value: borrowed.length, sub: 'currently reading', emoji: '📌', color: '#4361EE', bg: '#EEF0FD' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[#E8EDF0] flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: '#6B8EA0' }}>{stat.label}</span>
              <span className="text-lg">{stat.emoji}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: stat.color, fontFamily: "'Baloo 2', sans-serif" }}>{stat.value}</p>
            <p className="text-xs" style={{ color: '#9BB5C0' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currently borrowed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
              Currently Borrowed
            </h2>
            <button onClick={() => onNavigate('my-books')} className="text-xs font-semibold" style={{ color: '#2A9D8F' }}>View all →</button>
          </div>

          {borrowed.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-[#E8EDF0] text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold text-[#264653]">No books borrowed yet</p>
              <p className="text-sm text-[#6B8EA0] mt-1">Head to the catalog to find your next read!</p>
              <button onClick={() => onNavigate('catalog')} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2A9D8F' }}>
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {borrowed.map(({ record, book }) => {
                const due = new Date(record.dueDate);
                const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const progressPct = Math.max(0, Math.min(100, ((14 - diff) / 14) * 100));
                return (
                  <div
                    key={record.bookId}
                    className="bg-white rounded-2xl p-4 border border-[#E8EDF0] flex gap-4 cursor-pointer hover:shadow-md transition-all hover:border-[#2A9D8F]/30"
                    onClick={() => onNavigate('book-details', book.id)}
                  >
                    <BookCover book={book} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#264653] text-sm leading-tight mb-0.5 truncate" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#6B8EA0] mb-2">{book.author}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <DueDateBadge dueDate={record.dueDate} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#E8EDF0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: diff <= 3 ? '#E76F51' : diff <= 7 ? '#F4A261' : '#2A9D8F',
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#6B8EA0] flex-shrink-0">
                          Due {new Date(record.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommended */}
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
              Recommended for You ✨
            </h2>
            <button onClick={() => onNavigate('catalog')} className="text-xs font-semibold" style={{ color: '#2A9D8F' }}>See all →</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recommended.map((book) => {
              const lvl = levelColors[book.readingLevel];
              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-md transition-all hover:border-[#2A9D8F]/30 flex flex-col gap-2"
                  onClick={() => onNavigate('book-details', book.id)}
                >
                  <BookCover book={book} size="md" className="w-full" />
                  <div>
                    <p className="text-sm font-bold text-[#264653] leading-tight line-clamp-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{book.title}</p>
                    <p className="text-xs text-[#6B8EA0] mt-0.5">{book.author}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <StarRating rating={book.rating} />
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: lvl.bg, color: lvl.text }}
                      >
                        {book.readingLevel.replace('Grades ', 'Gr ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Achievements */}
          <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>My Badges</h3>
              <button onClick={() => onNavigate('my-books')} className="text-xs font-semibold" style={{ color: '#2A9D8F' }}>All →</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {currentStudent.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                  style={{ backgroundColor: badge.earned ? '#FFF8E0' : '#F5F7F8', opacity: badge.earned ? 1 : 0.5 }}
                  title={badge.description}
                >
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: badge.earned ? '#264653' : '#9BB5C0' }}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reading progress */}
          <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Year Goal</h3>
            <div className="relative flex items-center justify-center mb-3">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E8EDF0" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#2A9D8F"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(currentStudent.booksReadThisYear / 20) * 251.2} 251.2`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold" style={{ color: '#264653', fontFamily: "'Baloo 2', sans-serif" }}>{currentStudent.booksReadThisYear}</p>
                <p className="text-[10px] text-[#6B8EA0]">of 20</p>
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: '#6B8EA0' }}>
              {20 - currentStudent.booksReadThisYear} books to reach your goal!
            </p>
          </div>

          {/* Wishlist peek */}
          <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Wishlist</h3>
              <button onClick={() => onNavigate('my-books')} className="text-xs font-semibold" style={{ color: '#2A9D8F' }}>View →</button>
            </div>
            <div className="space-y-2">
              {currentStudent.wishlist.slice(0, 3).map((bookId) => {
                const book = books.find((b) => b.id === bookId);
                if (!book) return null;
                return (
                  <div
                    key={bookId}
                    className="flex gap-2 items-center cursor-pointer hover:bg-[#F5F7F8] rounded-lg p-1 transition-colors"
                    onClick={() => onNavigate('book-details', book.id)}
                  >
                    <BookCover book={book} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#264653] truncate">{book.title}</p>
                      <p className="text-[10px] text-[#6B8EA0]">{book.author}</p>
                    </div>
                    <span className="text-[#F4A261] text-sm flex-shrink-0">🔖</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
