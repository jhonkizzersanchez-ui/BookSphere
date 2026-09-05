export type ReadingLevel = 'Grades 1-2' | 'Grades 3-5' | 'Grades 6-8' | 'Grades 9-12';

export interface Review {
  id: string;
  studentName: string;
  grade: number;
  rating: number;
  text: string;
  date: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string[];
  readingLevel: ReadingLevel;
  lexile?: number;
  arPoints?: number;
  rating: number;
  reviewCount: number;
  totalCopies: number;
  borrowedCopies: number;
  coverColor: string;
  coverAccent: string;
  synopsis: string;
  series?: string;
  yearPublished: number;
  reviews?: Review[];
}

export interface BorrowRecord {
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
}

export interface ClassStudent {
  id: string;
  name: string;
  grade: number;
  readingLevel: ReadingLevel;
  currentBookId: string | null;
  booksReadThisYear: number;
  overdueCount: number;
  lastActive: string;
}

export const books: Book[] = [
  {
    id: 'b1',
    title: 'The Giver',
    author: 'Lois Lowry',
    genre: ['Science Fiction', 'Dystopian'],
    readingLevel: 'Grades 6-8',
    lexile: 760,
    arPoints: 8.0,
    rating: 4.7,
    reviewCount: 89,
    totalCopies: 4,
    borrowedCopies: 2,
    coverColor: '#2A9D8F',
    coverAccent: '#1E7268',
    synopsis:
      'In a seemingly perfect community without war, pain, suffering, differences, or choice, a young boy is given the sole responsibility of keeping the community\'s collective memory — including its color, love, and history.',
    yearPublished: 1993,
    reviews: [
      { id: 'r1', studentName: 'Mia T.', grade: 7, rating: 5, text: 'This book made me think about what it means to be human. Incredible story — one of the best I\'ve ever read!', date: '2024-03-15' },
      { id: 'r2', studentName: 'Jordan K.', grade: 8, rating: 4, text: 'A bit slow at first but the ending completely blew my mind. Definitely recommend for everyone.', date: '2024-02-28' },
      { id: 'r3', studentName: 'Sofia A.', grade: 7, rating: 5, text: 'Makes you appreciate the world we live in. The concept is so unique and fascinating.', date: '2024-02-10' },
    ],
  },
  {
    id: 'b2',
    title: 'Wonder',
    author: 'R.J. Palacio',
    genre: ['Realistic Fiction', 'Middle Grade'],
    readingLevel: 'Grades 3-5',
    lexile: 790,
    arPoints: 9.0,
    rating: 4.9,
    reviewCount: 124,
    totalCopies: 6,
    borrowedCopies: 5,
    coverColor: '#F4A261',
    coverAccent: '#D4823E',
    synopsis:
      'August Pullman was born with a facial difference that has prevented him from going to a mainstream school. Starting 5th grade at Beecher Prep, he wants nothing more than to be treated as an ordinary kid.',
    yearPublished: 2012,
    reviews: [
      { id: 'r4', studentName: 'Sam L.', grade: 5, rating: 5, text: 'I cried at the end! August is so brave. Everyone should read this book.', date: '2024-03-20' },
      { id: 'r5', studentName: 'Priya M.', grade: 4, rating: 5, text: 'My favorite book ever. Made me want to be kinder to everyone around me.', date: '2024-03-10' },
    ],
  },
  {
    id: 'b3',
    title: 'The Lightning Thief',
    author: 'Rick Riordan',
    genre: ['Fantasy', 'Adventure', 'Mythology'],
    readingLevel: 'Grades 3-5',
    lexile: 680,
    arPoints: 9.0,
    rating: 4.8,
    reviewCount: 203,
    totalCopies: 8,
    borrowedCopies: 8,
    coverColor: '#264653',
    coverAccent: '#1A3240',
    synopsis:
      "Percy Jackson is a good kid who can't seem to focus on his schoolwork or control his temper. When his pre-algebra teacher turns into a monster, Percy discovers he's the son of a Greek god.",
    series: 'Percy Jackson & the Olympians',
    yearPublished: 2005,
    reviews: [
      { id: 'r6', studentName: 'Alex C.', grade: 5, rating: 5, text: 'Best book series EVER! I read all 5 books in two weeks. Percy is the best!', date: '2024-03-18' },
    ],
  },
  {
    id: 'b4',
    title: 'The Hunger Games',
    author: 'Suzanne Collins',
    genre: ['Science Fiction', 'Dystopian', 'Adventure'],
    readingLevel: 'Grades 9-12',
    lexile: 810,
    arPoints: 12.0,
    rating: 4.8,
    reviewCount: 178,
    totalCopies: 5,
    borrowedCopies: 3,
    coverColor: '#C55A3E',
    coverAccent: '#A04030',
    synopsis:
      'In the ruins of North America lies Panem, where the Capitol holds a lottery each year to select two young representatives from each district to compete in the Hunger Games — a televised fight to the death.',
    series: 'The Hunger Games',
    yearPublished: 2008,
    reviews: [
      { id: 'r7', studentName: 'Tyler B.', grade: 10, rating: 5, text: "Absolutely gripping. Katniss is one of the best protagonists I've ever read.", date: '2024-03-12' },
      { id: 'r8', studentName: 'Zoe R.', grade: 9, rating: 4, text: 'Amazing but very intense in some parts. Super gripping from start to finish.', date: '2024-03-05' },
    ],
  },
  {
    id: 'b5',
    title: 'Holes',
    author: 'Louis Sachar',
    genre: ['Adventure', 'Mystery'],
    readingLevel: 'Grades 6-8',
    lexile: 660,
    arPoints: 7.0,
    rating: 4.6,
    reviewCount: 95,
    totalCopies: 4,
    borrowedCopies: 1,
    coverColor: '#7C6A5A',
    coverAccent: '#5C4A3A',
    synopsis:
      "Stanley Yelnats is under a family curse. Now unjustly sent to a boys' detention center called Camp Green Lake, he must dig holes all day — but what are they really looking for?",
    yearPublished: 1998,
    reviews: [
      { id: 'r9', studentName: 'Marcus H.', grade: 7, rating: 5, text: 'Hilarious and so interesting at the same time. The ending was absolutely perfect!', date: '2024-02-20' },
    ],
  },
  {
    id: 'b6',
    title: 'Matilda',
    author: 'Roald Dahl',
    genre: ['Fantasy', 'Comedy'],
    readingLevel: 'Grades 3-5',
    lexile: 840,
    arPoints: 7.0,
    rating: 4.7,
    reviewCount: 156,
    totalCopies: 5,
    borrowedCopies: 2,
    coverColor: '#9B5DE5',
    coverAccent: '#7B3DC5',
    synopsis:
      'Matilda is a remarkable girl with extraordinary powers. Despite her neglectful parents and tyrannical headmistress Miss Trunchbull, Matilda discovers she has the power to change her own destiny.',
    yearPublished: 1988,
    reviews: [
      { id: 'r10', studentName: 'Lucy P.', grade: 4, rating: 5, text: 'Matilda is the smartest and bravest girl! I wish I had powers like her.', date: '2024-03-22' },
    ],
  },
  {
    id: 'b7',
    title: 'A Wrinkle in Time',
    author: "Madeleine L'Engle",
    genre: ['Science Fiction', 'Fantasy'],
    readingLevel: 'Grades 6-8',
    lexile: 740,
    arPoints: 9.0,
    rating: 4.4,
    reviewCount: 73,
    totalCopies: 3,
    borrowedCopies: 2,
    coverColor: '#4361EE',
    coverAccent: '#2B47CE',
    synopsis:
      'Thirteen-year-old Meg Murry must travel through space and time to rescue her scientist father, held prisoner on a distant, dark planet ruled by an evil force.',
    yearPublished: 1962,
  },
  {
    id: 'b8',
    title: 'Hatchet',
    author: 'Gary Paulsen',
    genre: ['Adventure', 'Survival'],
    readingLevel: 'Grades 6-8',
    lexile: 1020,
    arPoints: 7.0,
    rating: 4.5,
    reviewCount: 88,
    totalCopies: 4,
    borrowedCopies: 0,
    coverColor: '#588157',
    coverAccent: '#3A5A40',
    synopsis:
      'Thirteen-year-old Brian is the sole survivor of a plane crash deep in the Canadian wilderness. Armed only with his hatchet, he must find a way to survive completely alone in the wild.',
    yearPublished: 1987,
  },
  {
    id: 'b9',
    title: "Charlotte's Web",
    author: 'E.B. White',
    genre: ['Animals', "Children's"],
    readingLevel: 'Grades 1-2',
    lexile: 680,
    arPoints: 4.0,
    rating: 4.8,
    reviewCount: 142,
    totalCopies: 6,
    borrowedCopies: 3,
    coverColor: '#52B788',
    coverAccent: '#3A9A6E',
    synopsis:
      "The story of a little girl named Fern who loves a little pig named Wilbur, and the extraordinary friendship between Wilbur and a clever spider named Charlotte who saves his life.",
    yearPublished: 1952,
  },
  {
    id: 'b10',
    title: "Ender's Game",
    author: 'Orson Scott Card',
    genre: ['Science Fiction', 'Adventure'],
    readingLevel: 'Grades 9-12',
    lexile: 780,
    arPoints: 10.0,
    rating: 4.9,
    reviewCount: 167,
    totalCopies: 3,
    borrowedCopies: 3,
    coverColor: '#023E8A',
    coverAccent: '#03045E',
    synopsis:
      "Andrew 'Ender' Wiggin is recruited into Battle School to become Earth's greatest military mind. But the real war is nothing like the computer simulations he's been training on.",
    yearPublished: 1985,
  },
  {
    id: 'b11',
    title: 'Diary of a Wimpy Kid',
    author: 'Jeff Kinney',
    genre: ['Comedy', 'Graphic Novel'],
    readingLevel: 'Grades 3-5',
    lexile: 950,
    arPoints: 4.0,
    rating: 4.5,
    reviewCount: 234,
    totalCopies: 7,
    borrowedCopies: 4,
    coverColor: '#E9C46A',
    coverAccent: '#C9A44A',
    synopsis:
      'Greg Heffley chronicles his middle school adventures in his diary — from surviving his older brother Rodrick to navigating the wild social jungle that is middle school.',
    series: 'Diary of a Wimpy Kid',
    yearPublished: 2007,
  },
  {
    id: 'b12',
    title: 'The House on Mango Street',
    author: 'Sandra Cisneros',
    genre: ['Realistic Fiction', 'Coming of Age'],
    readingLevel: 'Grades 9-12',
    lexile: 870,
    arPoints: 5.0,
    rating: 4.3,
    reviewCount: 61,
    totalCopies: 3,
    borrowedCopies: 1,
    coverColor: '#D62828',
    coverAccent: '#B02020',
    synopsis:
      'Told through a series of lyrical vignettes, a young Latina girl growing up in Chicago gives voice to her neighborhood and world in a way that changed American literature.',
    yearPublished: 1984,
  },
];

export const classStudents: ClassStudent[] = [
  { id: 's1', name: 'Alex Rivera', grade: 7, readingLevel: 'Grades 6-8', currentBookId: 'b1', booksReadThisYear: 8, overdueCount: 0, lastActive: '2024-03-22' },
  { id: 's2', name: 'Maya Thompson', grade: 7, readingLevel: 'Grades 6-8', currentBookId: 'b5', booksReadThisYear: 12, overdueCount: 0, lastActive: '2024-03-21' },
  { id: 's3', name: 'Jaylen Brooks', grade: 7, readingLevel: 'Grades 3-5', currentBookId: 'b11', booksReadThisYear: 5, overdueCount: 1, lastActive: '2024-03-18' },
  { id: 's4', name: 'Priya Patel', grade: 7, readingLevel: 'Grades 9-12', currentBookId: 'b4', booksReadThisYear: 18, overdueCount: 0, lastActive: '2024-03-22' },
  { id: 's5', name: 'Noah Kim', grade: 7, readingLevel: 'Grades 6-8', currentBookId: null, booksReadThisYear: 3, overdueCount: 2, lastActive: '2024-03-10' },
  { id: 's6', name: 'Isabella Cruz', grade: 7, readingLevel: 'Grades 6-8', currentBookId: 'b7', booksReadThisYear: 9, overdueCount: 0, lastActive: '2024-03-20' },
  { id: 's7', name: 'Marcus Johnson', grade: 7, readingLevel: 'Grades 3-5', currentBookId: 'b6', booksReadThisYear: 7, overdueCount: 0, lastActive: '2024-03-21' },
  { id: 's8', name: 'Zoe Williams', grade: 7, readingLevel: 'Grades 6-8', currentBookId: 'b8', booksReadThisYear: 11, overdueCount: 0, lastActive: '2024-03-22' },
  { id: 's9', name: 'Ethan Davis', grade: 7, readingLevel: 'Grades 9-12', currentBookId: null, booksReadThisYear: 2, overdueCount: 1, lastActive: '2024-03-05' },
  { id: 's10', name: 'Sofia Lee', grade: 7, readingLevel: 'Grades 6-8', currentBookId: 'b1', booksReadThisYear: 14, overdueCount: 0, lastActive: '2024-03-22' },
];

export const currentStudent = {
  id: 's1',
  name: 'Alex Rivera',
  grade: 7,
  class: '7B',
  readingLevel: 'Grades 6-8' as ReadingLevel,
  borrowedBooks: [
    { bookId: 'b1', borrowDate: '2024-03-10', dueDate: '2024-03-31' },
    { bookId: 'b5', borrowDate: '2024-03-15', dueDate: '2024-03-25' },
  ] as BorrowRecord[],
  readingHistory: [
    { bookId: 'b3', borrowDate: '2024-02-01', dueDate: '2024-02-21', returnDate: '2024-02-19' },
    { bookId: 'b6', borrowDate: '2024-01-15', dueDate: '2024-02-04', returnDate: '2024-02-02' },
    { bookId: 'b9', borrowDate: '2023-12-01', dueDate: '2023-12-21', returnDate: '2023-12-18' },
    { bookId: 'b11', borrowDate: '2023-11-05', dueDate: '2023-11-25', returnDate: '2023-11-20' },
    { bookId: 'b8', borrowDate: '2023-10-10', dueDate: '2023-10-30', returnDate: '2023-10-28' },
  ] as BorrowRecord[],
  wishlist: ['b4', 'b10', 'b7'],
  badges: [
    { id: 'bg1', name: 'Bookworm', emoji: '📚', description: 'Read your first 5 books', earned: true },
    { id: 'bg2', name: 'Speed Reader', emoji: '⚡', description: 'Return a book early 3 times', earned: true },
    { id: 'bg3', name: 'Explorer', emoji: '🗺️', description: 'Read books from 3 different genres', earned: true },
    { id: 'bg4', name: 'Adventurer', emoji: '⛰️', description: 'Read 10 books this school year', earned: false },
    { id: 'bg5', name: 'Scholar', emoji: '🎓', description: 'Complete a teacher reading list', earned: false },
    { id: 'bg6', name: 'Series Champion', emoji: '👑', description: 'Read every book in a series', earned: false },
  ] as Badge[],
  readingStreak: 12,
  booksReadThisYear: 8,
};

export const levelColors: Record<ReadingLevel, { bg: string; text: string; border: string }> = {
  'Grades 1-2': { bg: '#E8F5F3', text: '#1E7268', border: '#A8DAD7' },
  'Grades 3-5': { bg: '#FFF3E8', text: '#B56120', border: '#F4C08A' },
  'Grades 6-8': { bg: '#EEF0FD', text: '#2B47CE', border: '#B4BCEF' },
  'Grades 9-12': { bg: '#FEF0EE', text: '#A04030', border: '#F0B0A0' },
};

export const genreColors: Record<string, string> = {
  'Adventure': '#F4A261',
  'Fantasy': '#9B5DE5',
  'Science Fiction': '#4361EE',
  'Dystopian': '#C55A3E',
  'Mystery': '#588157',
  'Realistic Fiction': '#2A9D8F',
  'Historical Fiction': '#7C6A5A',
  'Comedy': '#E9C46A',
  'Mythology': '#D62828',
  'Graphic Novel': '#023E8A',
  "Children's": '#52B788',
  'Middle Grade': '#F4A261',
  'Survival': '#588157',
  'Animals': '#52B788',
  'Coming of Age': '#9B5DE5',
};
