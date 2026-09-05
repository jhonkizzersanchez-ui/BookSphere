import type { Book } from '../data';

interface BookCoverProps {
  book: Book;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: { wrapper: 'w-10 h-14', title: 'text-[7px]', author: 'text-[6px]' },
  sm: { wrapper: 'w-16 h-24', title: 'text-[9px]', author: 'text-[8px]' },
  md: { wrapper: 'w-24 h-36', title: 'text-xs', author: 'text-[9px]' },
  lg: { wrapper: 'w-36 h-52', title: 'text-sm', author: 'text-xs' },
  xl: { wrapper: 'w-48 h-72', title: 'text-base', author: 'text-sm' },
};

export default function BookCover({ book, size = 'md', className = '' }: BookCoverProps) {
  const s = sizes[size];
  return (
    <div
      className={`${s.wrapper} ${className} rounded-lg flex-shrink-0 relative overflow-hidden shadow-md`}
      style={{ background: `linear-gradient(145deg, ${book.coverColor} 0%, ${book.coverAccent} 100%)` }}
    >
      {/* Spine line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20" />
      {/* Decorative oval */}
      <div
        className="absolute top-1/4 right-[-20%] w-3/4 aspect-square rounded-full opacity-10"
        style={{ background: 'white' }}
      />
      {/* Series badge */}
      {book.series && (
        <div className="absolute top-2 right-2 bg-white/20 rounded px-1">
          <span className={`${s.author} text-white font-semibold leading-tight block`}>Series</span>
        </div>
      )}
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent pt-6">
        <p className={`${s.author} text-white/70 font-medium leading-tight mb-0.5 truncate`}>
          {book.author}
        </p>
        <p className={`${s.title} text-white font-bold leading-tight line-clamp-2`} style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          {book.title}
        </p>
      </div>
    </div>
  );
}
