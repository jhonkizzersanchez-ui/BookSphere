import { useState } from 'react';
import { books, classStudents, levelColors } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  userName: string;
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

const readingListBooks = [
  { bookId: 'b1', required: true },
  { bookId: 'b5', required: false },
  { bookId: 'b7', required: false },
];

export default function TeacherDashboard({ onNavigate, onToast, userName }: Props) {
  const [activeTab, setActiveTab] = useState<'class' | 'lists' | 'requests'>('class');
  const [searchStudent, setSearchStudent] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);

  const overdueStudents = classStudents.filter((s) => s.overdueCount > 0);
  const totalOverdue = classStudents.reduce((sum, s) => sum + s.overdueCount, 0);
  const avgBooks = Math.round(classStudents.reduce((sum, s) => sum + s.booksReadThisYear, 0) / classStudents.length);
  const activeReaders = classStudents.filter((s) => s.currentBookId).length;

  const filtered = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
            Class 7B — Reading Overview
          </h1>
          <p className="text-sm" style={{ color: '#6B8EA0' }}>{userName} · Reading overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToast('Report exported!', 'success')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#E8EDF0] bg-white text-[#264653] hover:bg-[#F0F4F6] transition-colors"
          >
            📊 Export Report
          </button>
          <button
            onClick={() => onToast('Reminder sent to all students with overdue books!', 'success')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#4361EE' }}
          >
            📬 Send Reminders
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Students', value: classStudents.length, sub: 'in your class', emoji: '👥', color: '#4361EE', bg: '#EEF0FD' },
          { label: 'Active Readers', value: activeReaders, sub: 'currently borrowing', emoji: '📖', color: '#2A9D8F', bg: '#E8F5F3' },
          { label: 'Overdue Books', value: totalOverdue, sub: `${overdueStudents.length} student${overdueStudents.length !== 1 ? 's' : ''} affected`, emoji: '⚠️', color: totalOverdue > 0 ? '#E76F51' : '#52B788', bg: totalOverdue > 0 ? '#FEF0EE' : '#E8F8F0' },
          { label: 'Avg Books Read', value: avgBooks, sub: 'this school year', emoji: '📚', color: '#F4A261', bg: '#FFF3E8' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#6B8EA0' }}>{stat.label}</span>
              <span className="text-lg">{stat.emoji}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: stat.color, fontFamily: "'Baloo 2', sans-serif" }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9BB5C0' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueStudents.length > 0 && (
        <div className="bg-[#FEF0EE] border border-[#F0B0A0] rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#C55A3E' }}>
              {overdueStudents.length} student{overdueStudents.length !== 1 ? 's have' : ' has'} overdue books
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#A04030' }}>
              {overdueStudents.map((s) => s.name).join(', ')}
            </p>
          </div>
          <button
            onClick={() => onToast('Reminders sent to students with overdue books!', 'success')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white flex-shrink-0"
            style={{ backgroundColor: '#E76F51' }}
          >
            Send Reminders
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E8EDF0]">
        {(['class', 'lists', 'requests'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === tab ? '#4361EE' : 'transparent',
              color: activeTab === tab ? 'white' : '#6B8EA0',
            }}
          >
            {tab === 'class' ? '👥 Class Reading' : tab === 'lists' ? '📋 Reading Lists' : '📦 Requests'}
          </button>
        ))}
      </div>

      {/* Class Reading tab */}
      {activeTab === 'class' && (
        <div className="bg-white rounded-2xl border border-[#E8EDF0] overflow-hidden">
          <div className="p-4 border-b border-[#E8EDF0] flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
              Student Reading Status
            </h3>
            <input
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Search students…"
              className="px-3 py-1.5 rounded-lg border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/30"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8EDF0]">
                  {['Student', 'Reading Level', 'Current Book', 'Books Read', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B8EA0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => {
                  const currentBook = student.currentBookId ? books.find((b) => b.id === student.currentBookId) : null;
                  const lvl = levelColors[student.readingLevel];
                  return (
                    <tr key={student.id} className={`border-b border-[#F0F4F6] hover:bg-[#F8FAFB] transition-colors ${i % 2 === 0 ? '' : 'bg-[#FAFCFD]'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: '#4361EE' }}
                          >
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-[#264653]">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lvl.bg, color: lvl.text }}>
                          {student.readingLevel.replace('Grades ', 'Gr ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {currentBook ? (
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:opacity-70"
                            onClick={() => onNavigate('book-details', currentBook.id)}
                          >
                            <BookCover book={currentBook} size="xs" />
                            <div>
                              <p className="text-xs font-semibold text-[#264653] leading-tight">{currentBook.title}</p>
                              <p className="text-[10px] text-[#6B8EA0]">{currentBook.author}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#9BB5C0]">Not borrowing</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#E8EDF0] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (student.booksReadThisYear / 20) * 100)}%`,
                                backgroundColor: '#4361EE',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#264653]">{student.booksReadThisYear}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {student.overdueCount > 0 ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF0EE', color: '#E76F51' }}>
                            {student.overdueCount} overdue
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E8F8F0', color: '#2D7A50' }}>
                            ✓ On track
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reading Lists tab */}
      {activeTab === 'lists' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF0] p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Spring Reading List — 7B</h3>
                <p className="text-xs text-[#6B8EA0]">3 books · 7 of 10 students on track</p>
              </div>
              <button
                onClick={() => setShowAddBook(!showAddBook)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: '#4361EE' }}
              >
                + Add Book
              </button>
            </div>

            {showAddBook && (
              <div className="mb-4 p-3 rounded-xl border border-[#E8EDF0] bg-[#F8FAFB]">
                <p className="text-xs font-semibold text-[#264653] mb-2">Add book to reading list</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {books.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => { onToast(`"${book.title}" added to reading list!`, 'success'); setShowAddBook(false); }}
                      className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-white border border-transparent hover:border-[#E8EDF0] transition-all"
                    >
                      <BookCover book={book} size="xs" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#264653] truncate">{book.title}</p>
                        <p className="text-[10px] text-[#6B8EA0]">{book.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {readingListBooks.map(({ bookId, required }) => {
                const book = books.find((b) => b.id === bookId)!;
                if (!book) return null;
                const lvl = levelColors[book.readingLevel];
                return (
                  <div key={bookId} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFB] border border-[#E8EDF0]">
                    <BookCover book={book} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-[#264653]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{book.title}</span>
                        {required && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEF0EE] text-[#E76F51]">Required</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B8EA0]">{book.author}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: lvl.bg, color: lvl.text }}>
                          {book.readingLevel}
                        </span>
                        <span className="text-[9px] font-medium text-[#6B8EA0]">7 of 10 students borrowed</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('book-details', book.id)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#E8EDF0] text-[#264653] hover:bg-white transition-colors flex-shrink-0"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onToast('New reading list created!', 'success')}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#D8E8EC] text-sm font-semibold text-[#6B8EA0] hover:border-[#4361EE] hover:text-[#4361EE] transition-all"
          >
            + Create New Reading List
          </button>
        </div>
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF0] p-5">
            <h3 className="font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Request Classroom Copies</h3>
            <p className="text-sm text-[#6B8EA0] mb-4">Need multiple copies of a book for a class project or group read? Submit a request to the library.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#264653] mb-1">Book Title</label>
                <input placeholder="Search or enter title…" className="w-full px-3 py-2 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#264653] mb-1">Number of Copies</label>
                <input type="number" min="1" max="35" defaultValue="10" className="w-full px-3 py-2 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/30" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#264653] mb-1">Needed by Date</label>
                <input type="date" defaultValue="2024-04-01" className="w-full px-3 py-2 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/30" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#264653] mb-1">Notes for Librarian</label>
                <textarea rows={2} placeholder="Any additional context for this request…" className="w-full px-3 py-2 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/30 resize-none" />
              </div>
            </div>
            <button
              onClick={() => onToast('Request submitted! The librarian will review it. 📦', 'success')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#4361EE' }}
            >
              Submit Request
            </button>
          </div>

          {/* Past requests */}
          <div className="bg-white rounded-2xl border border-[#E8EDF0] p-5">
            <h3 className="font-bold mb-3" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Recent Requests</h3>
            {[
              { book: 'The Giver', copies: 12, status: 'approved', date: '2024-03-10' },
              { book: 'Holes', copies: 10, status: 'pending', date: '2024-03-18' },
            ].map((req) => (
              <div key={req.book} className="flex items-center justify-between py-3 border-b border-[#F0F4F6] last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[#264653]">{req.book}</p>
                  <p className="text-xs text-[#6B8EA0]">{req.copies} copies · {new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: req.status === 'approved' ? '#E8F5F3' : '#FFF3E8',
                    color: req.status === 'approved' ? '#1E7268' : '#B56120',
                  }}
                >
                  {req.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
