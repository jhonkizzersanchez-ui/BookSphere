import { useState } from 'react';
import { books, classStudents, levelColors } from '../data';
import BookCover from '../components/BookCover';
import AccountApprovals from '../components/AccountApprovals';
import type { View } from '../App';

interface Props {
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

type Section = 'dashboard' | 'books' | 'students' | 'reports' | 'accounts';

interface AddBookForm {
  title: string;
  author: string;
  genre: string;
  readingLevel: string;
  arPoints: string;
  lexile: string;
  copies: string;
  yearPublished: string;
}

const emptyForm: AddBookForm = { title: '', author: '', genre: '', readingLevel: 'Grades 6-8', arPoints: '', lexile: '', copies: '3', yearPublished: '' };

export default function LibrarianPanel({ onToast }: Props) {
  const [section, setSection] = useState<Section>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<typeof books[0] | null>(null);
  const [form, setForm] = useState<AddBookForm>(emptyForm);
  const [searchBooks, setSearchBooks] = useState('');
  const [searchStudents, setSearchStudents] = useState('');

  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + b.totalCopies, 0);
  const borrowedCopies = books.reduce((s, b) => s + b.borrowedCopies, 0);
  const overdueStudents = classStudents.filter((s) => s.overdueCount > 0);

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchBooks.toLowerCase()) ||
      b.author.toLowerCase().includes(searchBooks.toLowerCase())
  );

  const openAdd = () => { setEditingBook(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (book: typeof books[0]) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre.join(', '),
      readingLevel: book.readingLevel,
      arPoints: book.arPoints?.toString() ?? '',
      lexile: book.lexile?.toString() ?? '',
      copies: book.totalCopies.toString(),
      yearPublished: book.yearPublished.toString(),
    });
    setShowModal(true);
  };
  const handleSave = () => {
    onToast(editingBook ? `"${form.title}" updated! ✏️` : `"${form.title}" added to catalog! 📚`, 'success');
    setShowModal(false);
  };

  const navItems: { id: Section; label: string; emoji: string }[] = [
    { id: 'dashboard', label: 'Dashboard', emoji: '🏠' },
    { id: 'books', label: 'Manage Books', emoji: '📚' },
    { id: 'students', label: 'Students', emoji: '👥' },
    { id: 'reports', label: 'Reports', emoji: '📊' },
    { id: 'accounts', label: 'Accounts', emoji: '🔐' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Inner sidebar */}
      <aside className="hidden md:block w-52 flex-shrink-0 border-r border-[#E8EDF0] bg-white">
        <div className="p-4 space-y-1 sticky top-16">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B8EA0] mb-3 px-2">Librarian</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
              style={{
                backgroundColor: section === item.id ? '#F3EEFF' : 'transparent',
                color: section === item.id ? '#9B5DE5' : '#264653',
              }}
            >
              <span>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 px-4 md:px-6 py-5">
        {/* Mobile nav */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E8EDF0] mb-4 md:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: section === item.id ? '#9B5DE5' : 'transparent', color: section === item.id ? 'white' : '#6B8EA0' }}
            >
              {item.emoji}
            </button>
          ))}
        </div>

        {section === 'accounts' && <AccountApprovals />}

        {/* Dashboard */}
        {section === 'dashboard' && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Library Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Titles', value: totalBooks, sub: 'in collection', emoji: '📖', color: '#9B5DE5', bg: '#F3EEFF' },
                { label: 'Total Copies', value: totalCopies, sub: `${borrowedCopies} borrowed`, emoji: '📚', color: '#2A9D8F', bg: '#E8F5F3' },
                { label: 'Checked Out', value: borrowedCopies, sub: `${totalCopies - borrowedCopies} available`, emoji: '📤', color: '#4361EE', bg: '#EEF0FD' },
                { label: 'Overdue Items', value: overdueStudents.reduce((s, st) => s + st.overdueCount, 0), sub: `${overdueStudents.length} students`, emoji: '⚠️', color: '#E76F51', bg: '#FEF0EE' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#6B8EA0]">{s.label}</span>
                    <span className="text-lg">{s.emoji}</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: s.color, fontFamily: "'Baloo 2', sans-serif" }}>{s.value}</p>
                  <p className="text-xs text-[#9BB5C0] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => { setSection('books'); openAdd(); }}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-[#9B5DE5]/40 bg-[#F3EEFF]/60 hover:border-[#9B5DE5] transition-all text-left"
              >
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-bold text-[#264653]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Add New Book</p>
                  <p className="text-xs text-[#6B8EA0]">Add a title to the catalog</p>
                </div>
              </button>
              <button
                onClick={() => onToast('Overdue reminders sent to all affected students!', 'success')}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-[#E76F51]/40 bg-[#FEF0EE]/60 hover:border-[#E76F51] transition-all text-left"
              >
                <span className="text-2xl">📬</span>
                <div>
                  <p className="font-bold text-[#264653]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Send Overdue Notices</p>
                  <p className="text-xs text-[#6B8EA0]">{overdueStudents.length} student{overdueStudents.length !== 1 ? 's' : ''} with overdue books</p>
                </div>
              </button>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-2xl border border-[#E8EDF0] p-5">
              <h3 className="font-bold mb-3" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: 'Book borrowed', detail: 'Alex Rivera checked out "The Giver"', time: '2 hours ago', icon: '📤', color: '#2A9D8F' },
                  { action: 'Book returned', detail: 'Maya Thompson returned "Holes"', time: '3 hours ago', icon: '📥', color: '#52B788' },
                  { action: 'New request', detail: 'Ms. Chen requested 12 copies of "The Giver"', time: 'Yesterday', icon: '📦', color: '#4361EE' },
                  { action: 'Overdue reminder', detail: 'Reminder sent to Noah Kim', time: 'Yesterday', icon: '📬', color: '#F4A261' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}18` }}>
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#264653]">{item.action}</p>
                      <p className="text-xs text-[#6B8EA0]">{item.detail}</p>
                    </div>
                    <span className="text-xs text-[#9BB5C0] flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Books */}
        {section === 'books' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Manage Books</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => onToast('CSV template downloaded! Upload your file to bulk import.', 'info')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#E8EDF0] bg-white text-[#264653] hover:bg-[#F0F4F6]"
                >
                  📥 Bulk Import
                </button>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: '#9B5DE5' }}
                >
                  + Add Book
                </button>
              </div>
            </div>

            <input
              value={searchBooks}
              onChange={(e) => setSearchBooks(e.target.value)}
              placeholder="Search by title or author…"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#9B5DE5]/30"
            />

            <div className="bg-white rounded-2xl border border-[#E8EDF0] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EDF0]">
                    {['Book', 'Level', 'Copies', 'Available', 'Rating', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B8EA0]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => {
                    const lvl = levelColors[book.readingLevel];
                    const avail = book.totalCopies - book.borrowedCopies;
                    return (
                      <tr key={book.id} className="border-b border-[#F0F4F6] hover:bg-[#F8FAFB] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <BookCover book={book} size="xs" />
                            <div>
                              <p className="text-sm font-semibold text-[#264653]">{book.title}</p>
                              <p className="text-xs text-[#6B8EA0]">{book.author} · {book.yearPublished}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: lvl.bg, color: lvl.text }}>
                            {book.readingLevel.replace('Grades ', 'Gr ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#264653]">{book.totalCopies}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold" style={{ color: avail > 0 ? '#2D7A50' : '#E76F51' }}>
                            {avail}/{book.totalCopies}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs" style={{ color: '#F9C74F' }}>★</span>
                            <span className="text-xs font-semibold text-[#264653]">{book.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEdit(book)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onToast(`"${book.title}" removed from catalog.`, 'info')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#E76F51] hover:bg-[#FEF0EE]"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students */}
        {section === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Students & Borrowers</h1>
              <button
                onClick={() => onToast('Bulk reminder sent to all students with overdue books!', 'success')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: '#9B5DE5' }}
              >
                📬 Send All Reminders
              </button>
            </div>
            <input
              value={searchStudents}
              onChange={(e) => setSearchStudents(e.target.value)}
              placeholder="Search students…"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] focus:outline-none"
            />
            <div className="bg-white rounded-2xl border border-[#E8EDF0] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EDF0]">
                    {['Student', 'Grade', 'Reading Level', 'Books Read', 'Overdue', 'Last Active'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B8EA0]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classStudents
                    .filter((s) => s.name.toLowerCase().includes(searchStudents.toLowerCase()))
                    .map((student) => {
                      const lvl = levelColors[student.readingLevel];
                      return (
                        <tr key={student.id} className="border-b border-[#F0F4F6] hover:bg-[#F8FAFB] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#9B5DE5' }}>
                                {student.name.charAt(0)}
                              </div>
                              <span className="text-sm font-semibold text-[#264653]">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#264653]">Grade {student.grade}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: lvl.bg, color: lvl.text }}>
                              {student.readingLevel.replace('Grades ', 'Gr ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[#264653]">{student.booksReadThisYear}</td>
                          <td className="px-4 py-3">
                            {student.overdueCount > 0 ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEF0EE] text-[#E76F51]">{student.overdueCount}</span>
                                <button onClick={() => onToast(`Reminder sent to ${student.name}!`, 'success')} className="text-[10px] font-semibold text-[#E76F51] hover:underline">Remind</button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8F8F0] text-[#2D7A50]">✓ Clear</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#9BB5C0]">
                            {new Date(student.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports */}
        {section === 'reports' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Library Reports</h1>
              <button onClick={() => onToast('Full report exported!', 'success')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#E8EDF0] bg-white text-[#264653] hover:bg-[#F0F4F6]">
                📊 Export All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Most popular books */}
              <div className="bg-white rounded-2xl border border-[#E8EDF0] p-5">
                <h3 className="font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Most Popular Books</h3>
                <div className="space-y-3">
                  {[...books].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5).map((book, i) => {
                    const pct = (book.reviewCount / 234) * 100;
                    return (
                      <div key={book.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold w-4 text-[#9BB5C0]">{i + 1}</span>
                        <BookCover book={book} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#264653] truncate">{book.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 bg-[#E8EDF0] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#9B5DE5' }} />
                            </div>
                            <span className="text-[10px] text-[#6B8EA0] flex-shrink-0">{book.reviewCount} reviews</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reading level distribution */}
              <div className="bg-white rounded-2xl border border-[#E8EDF0] p-5">
                <h3 className="font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Collection by Reading Level</h3>
                <div className="space-y-3">
                  {(['Grades 1-2', 'Grades 3-5', 'Grades 6-8', 'Grades 9-12'] as const).map((level) => {
                    const count = books.filter((b) => b.readingLevel === level).length;
                    const pct = (count / books.length) * 100;
                    const lvl = levelColors[level];
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#264653]">{level}</span>
                          <span className="font-bold" style={{ color: lvl.text }}>{count} books ({Math.round(pct)}%)</span>
                        </div>
                        <div className="h-2 bg-[#E8EDF0] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: lvl.text }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overdue by class */}
              <div className="bg-white rounded-2xl border border-[#E8EDF0] p-5">
                <h3 className="font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Overdue Books by Student</h3>
                {overdueStudents.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="text-sm font-semibold text-[#2D7A50]">No overdue books!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {overdueStudents.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#F0F4F6]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[#E76F51]">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-sm text-[#264653]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEF0EE] text-[#E76F51]">
                            {s.overdueCount} overdue
                          </span>
                          <button onClick={() => onToast(`Reminder sent to ${s.name}!`, 'success')} className="text-xs font-semibold text-[#9B5DE5] hover:underline">
                            Remind
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Genre popularity */}
              <div className="bg-white rounded-2xl border border-[#E8EDF0] p-5">
                <h3 className="font-bold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>Genre Popularity</h3>
                <div className="space-y-2">
                  {[
                    { genre: 'Fantasy', pct: 82 },
                    { genre: 'Adventure', pct: 74 },
                    { genre: 'Science Fiction', pct: 68 },
                    { genre: 'Realistic Fiction', pct: 55 },
                    { genre: 'Comedy', pct: 42 },
                  ].map(({ genre, pct }) => (
                    <div key={genre} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[#264653] w-28 flex-shrink-0">{genre}</span>
                      <div className="flex-1 h-2 bg-[#E8EDF0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#2A9D8F' }} />
                      </div>
                      <span className="text-xs font-semibold text-[#6B8EA0] w-8 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(38, 70, 83, 0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F4F6] text-[#6B8EA0]">✕</button>
            </div>

            <div className="space-y-3">
              {[
                { field: 'title', label: 'Title', placeholder: 'Book title' },
                { field: 'author', label: 'Author', placeholder: 'Author name' },
                { field: 'genre', label: 'Genres', placeholder: 'e.g. Fantasy, Adventure' },
                { field: 'yearPublished', label: 'Year Published', placeholder: 'e.g. 2012' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-[#264653] mb-1">{label}</label>
                  <input
                    value={form[field as keyof AddBookForm]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#9B5DE5]/30"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-[#264653] mb-1">Reading Level</label>
                <select
                  value={form.readingLevel}
                  onChange={(e) => setForm({ ...form, readingLevel: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#9B5DE5]/30"
                >
                  <option>Grades 1-2</option>
                  <option>Grades 3-5</option>
                  <option>Grades 6-8</option>
                  <option>Grades 9-12</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { field: 'copies', label: 'Copies' },
                  { field: 'arPoints', label: 'AR Points' },
                  { field: 'lexile', label: 'Lexile' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-[#264653] mb-1">{label}</label>
                    <input
                      value={form[field as keyof AddBookForm]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      type="number"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#264653] mb-1">Cover Image</label>
                <div className="border-2 border-dashed border-[#E8EDF0] rounded-xl p-6 text-center hover:border-[#9B5DE5] transition-colors cursor-pointer">
                  <p className="text-3xl mb-1">🖼️</p>
                  <p className="text-xs text-[#6B8EA0]">Click to upload cover image</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6]">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#9B5DE5' }}>
                {editingBook ? 'Save Changes' : 'Add to Catalog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
