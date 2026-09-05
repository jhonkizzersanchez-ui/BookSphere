import { useState, useMemo } from 'react';
import { books, levelColors, genreColors } from '../data';
import type { ReadingLevel } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  initialQuery?: string;
}

const allGenres = [...new Set(books.flatMap((b) => b.genre))].sort();
const allLevels: ReadingLevel[] = ['Grades 1-2', 'Grades 3-5', 'Grades 6-8', 'Grades 9-12'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      <span className="text-xs" style={{ color: '#F9C74F' }}>★</span>
      <span className="text-xs font-bold" style={{ color: '#264653' }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function BookCatalog({ onNavigate, initialQuery = '' }: Props) {
  const [search, setSearch] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<ReadingLevel[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'rating' | 'newest'>('rating');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  const toggleLevel = (l: ReadingLevel) =>
    setSelectedLevels((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const filtered = useMemo(() => {
    let result = books.filter((b) => {
      const q = search.toLowerCase();
      if (q && !b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q) && !b.genre.some((g) => g.toLowerCase().includes(q))) return false;
      if (selectedGenres.length && !b.genre.some((g) => selectedGenres.includes(g))) return false;
      if (selectedLevels.length && !selectedLevels.includes(b.readingLevel)) return false;
      if (availableOnly && b.borrowedCopies >= b.totalCopies) return false;
      return true;
    });
    if (sortBy === 'title') result = result.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'rating') result = result.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'newest') result = result.sort((a, b) => b.yearPublished - a.yearPublished);
    return result;
  }, [search, selectedGenres, selectedLevels, availableOnly, sortBy]);

  const activeFilters = selectedGenres.length + selectedLevels.length + (availableOnly ? 1 : 0);

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 border-r border-[#E8EDF0] bg-white transition-all duration-200 overflow-y-auto ${sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'} hidden md:block`}
        style={{ position: 'sticky', top: 0, maxHeight: 'calc(100vh - 64px)', alignSelf: 'flex-start' }}
      >
        <div className="p-4 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B8EA0' }}>Filters</span>
            {activeFilters > 0 && (
              <button
                onClick={() => { setSelectedGenres([]); setSelectedLevels([]); setAvailableOnly(false); }}
                className="text-xs font-semibold"
                style={{ color: '#E76F51' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Availability */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#264653' }}>Availability</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 accent-[#2A9D8F] rounded"
              />
              <span className="text-sm text-[#264653]">Available now</span>
            </label>
          </div>

          {/* Reading Level */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#264653' }}>Reading Level</p>
            <div className="space-y-1.5">
              {allLevels.map((level) => {
                const lvl = levelColors[level];
                const active = selectedLevels.includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: active ? lvl.bg : 'transparent',
                      color: active ? lvl.text : '#264653',
                      border: `1px solid ${active ? lvl.border : 'transparent'}`,
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genre */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#264653' }}>Genre</p>
            <div className="space-y-1">
              {allGenres.map((genre) => {
                const active = selectedGenres.includes(genre);
                const color = genreColors[genre] ?? '#6B8EA0';
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-all"
                    style={{
                      backgroundColor: active ? `${color}18` : 'transparent',
                      color: active ? color : '#264653',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 md:px-6 py-5 space-y-4">
        {/* Top bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8EDF0] text-sm font-medium transition-colors hover:bg-[#F0F4F6]"
              style={{ color: '#264653' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filters {activeFilters > 0 && <span className="ml-1 bg-[#2A9D8F] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>}
            </button>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
              Book Catalog
            </h1>
            <span className="text-sm text-[#6B8EA0]">({filtered.length} books)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B8EA0] hidden sm:block">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm px-3 py-1.5 rounded-lg border border-[#E8EDF0] bg-white text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30"
            >
              <option value="rating">Top Rated</option>
              <option value="title">A–Z</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedLevels.map((l) => (
              <button
                key={l}
                onClick={() => toggleLevel(l)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: levelColors[l].bg, color: levelColors[l].text, border: `1px solid ${levelColors[l].border}` }}
              >
                {l} ✕
              </button>
            ))}
            {selectedGenres.map((g) => {
              const color = genreColors[g] ?? '#6B8EA0';
              return (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
                >
                  {g} ✕
                </button>
              );
            })}
            {availableOnly && (
              <button
                onClick={() => setAvailableOnly(false)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: '#E8F5F3', color: '#2A9D8F', border: '1px solid #A8DAD7' }}
              >
                Available now ✕
              </button>
            )}
          </div>
        )}

        {/* Mobile search */}
        <div className="md:hidden relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#6B8EA0" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="#6B8EA0" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] focus:outline-none"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-bold text-[#264653]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>No books found</p>
            <p className="text-sm text-[#6B8EA0] mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((book) => {
              const lvl = levelColors[book.readingLevel];
              const available = book.borrowedCopies < book.totalCopies;
              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-lg transition-all hover:border-[#2A9D8F]/30 hover:-translate-y-0.5 flex flex-col gap-2"
                  onClick={() => onNavigate('book-details', book.id)}
                >
                  <div className="relative">
                    <BookCover book={book} size="md" className="w-full" />
                    <div
                      className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: available ? '#E8F5F3' : '#F5F7F8', color: available ? '#1E7268' : '#9BB5C0' }}
                    >
                      {available ? `${book.totalCopies - book.borrowedCopies} avail.` : 'All out'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#264653] leading-tight line-clamp-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
                      {book.title}
                    </p>
                    <p className="text-xs text-[#6B8EA0] mt-0.5 truncate">{book.author}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <StarRating rating={book.rating} />
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: lvl.bg, color: lvl.text }}
                      >
                        {book.readingLevel.replace('Grades ', 'Gr ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {book.genre.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${genreColors[g] ?? '#6B8EA0'}18`, color: genreColors[g] ?? '#6B8EA0' }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    {book.arPoints !== undefined && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FFF3E8', color: '#B5651D' }}>
                          AR {book.arPoints} pts
                        </span>
                        {book.lexile !== undefined && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EAF0FF', color: '#3A4FBF' }}>
                            {book.lexile}L
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
