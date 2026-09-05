import { useMemo, useState } from 'react';
import { books, levelColors, genreColors } from '../data';
import BookCover from '../components/BookCover';
import type { View } from '../App';

interface Props {
  query: string;
  onNavigate: (view: View, bookId?: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  onSearch: (q: string) => void;
  setSearchQuery: (q: string) => void;
}

export default function SearchResults({ query, onNavigate, onSearch, setSearchQuery }: Props) {
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [inputValue, setInputValue] = useState(query);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return books.filter((b) => {
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.some((g) => g.toLowerCase().includes(q)) ||
        b.synopsis.toLowerCase().includes(q);
      const matchesGenre = !genreFilter || b.genre.includes(genreFilter);
      const matchesLevel = !levelFilter || b.readingLevel === levelFilter;
      const matchesAvail = !availableOnly || b.borrowedCopies < b.totalCopies;
      return matchesQuery && matchesGenre && matchesLevel && matchesAvail;
    });
  }, [query, genreFilter, levelFilter, availableOnly]);

  const activeGenres = [...new Set(results.flatMap((b) => b.genre))].slice(0, 8);
  const hasFilters = genreFilter || levelFilter || availableOnly;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchQuery(inputValue);
      onSearch(inputValue);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#6B8EA0" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="#6B8EA0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search books, authors, genres…"
          className="w-full pl-12 pr-12 py-3 rounded-2xl border-2 border-[#2A9D8F]/30 bg-white text-[#264653] text-base focus:outline-none focus:border-[#2A9D8F] transition-all shadow-sm"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9BB5C0] hover:text-[#264653]"
          >
            ✕
          </button>
        )}
      </form>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
            {query ? (
              <>Results for <span style={{ color: '#2A9D8F' }}>"{query}"</span></>
            ) : (
              'All Books'
            )}
          </h1>
          <p className="text-sm text-[#6B8EA0]">{results.length} book{results.length !== 1 ? 's' : ''} found</p>
        </div>
        {hasFilters && (
          <button
            onClick={() => { setGenreFilter(null); setLevelFilter(null); setAvailableOnly(false); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-[#E76F51] bg-[#FEF0EE] hover:bg-[#FDE0DA] transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Availability */}
        <button
          onClick={() => setAvailableOnly(!availableOnly)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
          style={{
            backgroundColor: availableOnly ? '#E8F5F3' : 'white',
            borderColor: availableOnly ? '#2A9D8F' : '#E8EDF0',
            color: availableOnly ? '#2A9D8F' : '#264653',
          }}
        >
          {availableOnly ? '✓ Available now' : 'Available now'}
        </button>

        {/* Level chips */}
        {(['Grades 1-2', 'Grades 3-5', 'Grades 6-8', 'Grades 9-12'] as const).map((level) => {
          const lvl = levelColors[level];
          const active = levelFilter === level;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(active ? null : level)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                backgroundColor: active ? lvl.bg : 'white',
                borderColor: active ? lvl.border : '#E8EDF0',
                color: active ? lvl.text : '#264653',
              }}
            >
              {active ? '✓ ' : ''}{level.replace('Grades ', 'Gr ')}
            </button>
          );
        })}

        {/* Genre chips */}
        {activeGenres.map((genre) => {
          const color = genreColors[genre] ?? '#6B8EA0';
          const active = genreFilter === genre;
          return (
            <button
              key={genre}
              onClick={() => setGenreFilter(active ? null : genre)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                backgroundColor: active ? `${color}18` : 'white',
                borderColor: active ? `${color}60` : '#E8EDF0',
                color: active ? color : '#264653',
              }}
            >
              {active ? '✓ ' : ''}{genre}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E8EDF0]">
          <p className="text-6xl mb-4">🔍</p>
          <h3 className="text-xl font-bold text-[#264653] mb-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
            No books found
          </h3>
          <p className="text-sm text-[#6B8EA0] mb-4">
            We could not find any books matching <strong>"{query}"</strong>
          </p>
          <div className="space-y-1 text-sm text-[#6B8EA0] mb-6">
            <p>Suggestions:</p>
            <p>• Check for spelling errors</p>
            <p>• Try a genre, author name, or keyword</p>
            <p>• Ask the librarian for help</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ backgroundColor: '#2A9D8F' }}
          >
            Browse Full Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((book) => {
            const lvl = levelColors[book.readingLevel];
            const available = book.borrowedCopies < book.totalCopies;
            const qLow = query.toLowerCase();
            const highlightTitle = book.title.toLowerCase().includes(qLow);
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-lg transition-all hover:border-[#2A9D8F]/30 hover:-translate-y-0.5 flex flex-col gap-2"
                onClick={() => onNavigate('book-details', book.id)}
              >
                <div className="relative">
                  <BookCover book={book} size="md" className="w-full" />
                  {!available && (
                    <div className="absolute inset-0 rounded-lg bg-black/20 flex items-end justify-center pb-2">
                      <span className="text-[9px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full">All Copies Out</span>
                    </div>
                  )}
                </div>
                <div>
                  <p
                    className="text-sm font-bold leading-tight line-clamp-2"
                    style={{ fontFamily: "'Baloo 2', sans-serif", color: highlightTitle ? '#2A9D8F' : '#264653' }}
                  >
                    {book.title}
                  </p>
                  <p className="text-xs text-[#6B8EA0] mt-0.5 truncate">{book.author}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs" style={{ color: '#F9C74F' }}>★</span>
                      <span className="text-xs font-semibold text-[#264653]">{book.rating.toFixed(1)}</span>
                    </div>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: lvl.bg, color: lvl.text }}
                    >
                      {book.readingLevel.replace('Grades ', 'Gr ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {book.genre.slice(0, 2).map((g) => (
                      <button
                        key={g}
                        onClick={(e) => { e.stopPropagation(); setGenreFilter(g); }}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${genreColors[g] ?? '#6B8EA0'}18`, color: genreColors[g] ?? '#6B8EA0' }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
