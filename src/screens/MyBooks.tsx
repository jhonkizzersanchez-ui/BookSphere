import { useState } from 'react';
import { books, currentStudent, levelColors } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

type Tab = 'borrowed' | 'history' | 'wishlist';

function DueStatus({ dueDate }: { dueDate: string }) {
  const due = new Date(dueDate);
  const today = new Date('2024-03-23');
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg" style={{ backgroundColor: '#FEF0EE' }}>
      <span className="text-sm">⚠️</span>
      <div>
        <p className="text-xs font-bold" style={{ color: '#E76F51' }}>Overdue by {Math.abs(diff)} day{Math.abs(diff) !== 1 ? 's' : ''}!</p>
        <p className="text-[10px]" style={{ color: '#C55A3E' }}>Please return ASAP</p>
      </div>
    </div>
  );
  if (diff <= 3) return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg" style={{ backgroundColor: '#FFF8E0' }}>
      <span className="text-sm">🕐</span>
      <div>
        <p className="text-xs font-bold" style={{ color: '#C49A00' }}>Due in {diff} day{diff !== 1 ? 's' : ''}</p>
        <p className="text-[10px]" style={{ color: '#A07A00' }}>{dueDate}</p>
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg" style={{ backgroundColor: '#E8F8F0' }}>
      <span className="text-sm">✅</span>
      <div>
        <p className="text-xs font-bold" style={{ color: '#2D7A50' }}>Due in {diff} days</p>
        <p className="text-[10px]" style={{ color: '#3A9A6E' }}>{dueDate}</p>
      </div>
    </div>
  );
}

export default function MyBooks({ onNavigate, onToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('borrowed');

  const borrowed = currentStudent.borrowedBooks
    .map((r) => ({ record: r, book: books.find((b) => b.id === r.bookId)! }))
    .filter((x) => x.book);

  const history = currentStudent.readingHistory
    .map((r) => ({ record: r, book: books.find((b) => b.id === r.bookId)! }))
    .filter((x) => x.book);

  const wishlist = currentStudent.wishlist
    .map((id) => books.find((b) => b.id === id)!)
    .filter(Boolean);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'borrowed', label: 'Currently Borrowed', count: borrowed.length },
    { id: 'history', label: 'Reading History', count: history.length },
    { id: 'wishlist', label: 'Wishlist', count: wishlist.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
        My Books
      </h1>

      {/* Achievement summary */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] p-4 mb-6 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <div className="text-center px-4 border-r border-[#E8EDF0]">
            <p className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#2A9D8F' }}>{currentStudent.booksReadThisYear}</p>
            <p className="text-xs text-[#6B8EA0]">Books read</p>
          </div>
          <div className="text-center px-4 border-r border-[#E8EDF0]">
            <p className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#E76F51' }}>{currentStudent.readingStreak}</p>
            <p className="text-xs text-[#6B8EA0]">Day streak 🔥</p>
          </div>
          {currentStudent.badges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center gap-1 px-3"
              style={{ opacity: badge.earned ? 1 : 0.3 }}
              title={badge.description}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <span className="text-[9px] font-medium text-[#264653] whitespace-nowrap">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 bg-white border border-[#E8EDF0]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? '#2A9D8F' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6B8EA0',
            }}
          >
            {tab.label}
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#F0F4F6',
                color: activeTab === tab.id ? 'white' : '#6B8EA0',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Borrowed tab */}
      {activeTab === 'borrowed' && (
        <div className="space-y-3">
          {borrowed.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EDF0]">
              <p className="text-5xl mb-3">📭</p>
              <p className="font-bold text-[#264653]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>No books borrowed</p>
              <p className="text-sm text-[#6B8EA0] mt-1">Find something great in the catalog!</p>
              <button
                onClick={() => onNavigate('catalog')}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: '#2A9D8F' }}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            borrowed.map(({ record, book }) => (
              <div
                key={record.bookId}
                className="bg-white rounded-2xl border border-[#E8EDF0] p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onNavigate('book-details', book.id)}
              >
                <BookCover book={book} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#264653] mb-0.5" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{book.title}</h3>
                  <p className="text-sm text-[#6B8EA0] mb-3">{book.author}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <DueStatus dueDate={record.dueDate} />
                    <button
                      onClick={(e) => { e.stopPropagation(); onToast('Return processed! Thank you. ✅', 'success'); }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6] transition-colors"
                    >
                      Mark Returned
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToast('Renewal requested! Extended by 7 days.', 'success'); }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: '#2A9D8F' }}
                    >
                      Renew
                    </button>
                  </div>
                  <p className="text-xs text-[#9BB5C0] mt-2">
                    Borrowed {new Date(record.borrowDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EDF0]">
              <p className="text-5xl mb-3">📖</p>
              <p className="font-bold text-[#264653]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>No reading history yet</p>
            </div>
          ) : (
            history.map(({ record, book }) => {
              const lvl = levelColors[book.readingLevel];
              return (
                <div
                  key={`${record.bookId}-${record.borrowDate}`}
                  className="bg-white rounded-2xl border border-[#E8EDF0] p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => onNavigate('book-details', book.id)}
                >
                  <BookCover book={book} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#264653] mb-0.5" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{book.title}</h3>
                    <p className="text-sm text-[#6B8EA0] mb-2">{book.author}</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: lvl.bg, color: lvl.text }}
                    >
                      {book.readingLevel}
                    </span>
                    <div className="flex gap-3 mt-2 text-xs text-[#9BB5C0]">
                      <span>Borrowed: {new Date(record.borrowDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {record.returnDate && (
                        <span>Returned: {new Date(record.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={(e) => { e.stopPropagation(); onToast(`Rated "${book.title}" ${s} stars! ⭐`, 'success'); }} className="text-base transition-transform hover:scale-125" style={{ color: '#F9C74F' }}>★</button>
                      ))}
                      <span className="ml-1 text-xs text-[#9BB5C0]">Rate this book</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#E8F8F0', color: '#2D7A50' }}>
                      ✓ Read
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Wishlist tab */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EDF0]">
              <p className="text-5xl mb-3">🔖</p>
              <p className="font-bold text-[#264653]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Your wishlist is empty</p>
              <p className="text-sm text-[#6B8EA0] mt-1">Save books you want to read next!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wishlist.map((book) => {
                const lvl = levelColors[book.readingLevel];
                const available = book.borrowedCopies < book.totalCopies;
                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl border border-[#E8EDF0] p-4 flex gap-3 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => onNavigate('book-details', book.id)}
                  >
                    <BookCover book={book} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#264653] text-sm leading-tight mb-0.5" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{book.title}</h3>
                      <p className="text-xs text-[#6B8EA0] mb-2">{book.author}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: lvl.bg, color: lvl.text }}
                        >
                          {book.readingLevel.replace('Grades ', 'Gr ')}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: available ? '#E8F5F3' : '#F5F7F8', color: available ? '#1E7268' : '#9BB5C0' }}
                        >
                          {available ? 'Available' : 'On hold'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToast(available ? `"${book.title}" borrowed! Due in 21 days. 📚` : 'Added to hold list!', 'success');
                        }}
                        className="mt-2 text-xs font-bold px-3 py-1 rounded-lg text-white transition-all"
                        style={{ backgroundColor: available ? '#2A9D8F' : '#F4A261' }}
                      >
                        {available ? '📚 Borrow' : '📋 Hold'}
                      </button>
                    </div>
                    <button
                      className="self-start text-[#F4A261] text-xl flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); onToast('Removed from wishlist.', 'info'); }}
                      title="Remove from wishlist"
                    >
                      🔖
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
