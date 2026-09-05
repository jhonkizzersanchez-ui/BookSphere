export type ReadingLevel = 'Grades 1-2' | 'Grades 3-5' | 'Grades 6-8' | 'Grades 9-12';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string[];
  readingLevel: ReadingLevel;
  rating: number;
  yearPublished: number;
  totalCopies: number;
  borrowedCopies: number;
  coverColor: string;
  coverAccent: string;
  series?: boolean;
  arPoints?: number;
  lexile?: number;
  summary?: string;
  reviewCount?: number;
}

export const levelColors: Record<ReadingLevel, { bg: string; text: string; border: string }> = {
  'Grades 1-2': { bg: '#E8F5F3', text: '#1E7268', border: '#A8DAD7' },
  'Grades 3-5': { bg: '#FFF3E0', text: '#B5651D', border: '#F4A261' },
  'Grades 6-8': { bg: '#EAF0FF', text: '#3A4FBF', border: '#A8B8F0' },
  'Grades 9-12': { bg: '#F5EAFB', text: '#7A3FA0', border: '#D3A8F0' },
};

export const genreColors: Record<string, string> = {
  Adventure: '#F4A261',
  Fantasy: '#9B5DE5',
  'Science Fiction': '#4361EE',
  Mystery: '#264653',
  Biography: '#2A9D8F',
  History: '#E76F51',
  Poetry: '#F15BB5',
  'Non-Fiction': '#00BBF9',
  Fiction: '#3A9F6E',
  Humor: '#F9C74F',
};

export interface BorrowRecord {
  bookId: string;
  dueDate: string;
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface Student {
  name: string;
  class: string;
  readingLevel: ReadingLevel;
  booksReadThisYear: number;
  readingStreak: number;
  borrowedBooks: BorrowRecord[];
  badges: Badge[];
  wishlist: string[];
}

export const currentStudent: Student = {
  name: 'Alex Rivera',
  class: 'Room 214',
  readingLevel: 'Grades 6-8',
  booksReadThisYear: 14,
  readingStreak: 6,
  borrowedBooks: [
    { bookId: 'b2', dueDate: '2024-03-25' },
    { bookId: 'b4', dueDate: '2024-03-30' },
  ],
  badges: [
    { id: 'bg1', emoji: '🔥', name: 'On Fire', description: 'Read 5 days in a row', earned: true },
    { id: 'bg2', emoji: '📚', name: 'Bookworm', description: 'Read 10 books this year', earned: true },
    { id: 'bg3', emoji: '🌟', name: 'Rising Star', description: 'Earned a 5-star rating on a review', earned: true },
    { id: 'bg4', emoji: '🏆', name: 'Champion', description: 'Read 20 books this year', earned: false },
    { id: 'bg5', emoji: '🧭', name: 'Explorer', description: 'Read books from 5 different genres', earned: false },
    { id: 'bg6', emoji: '⚡', name: 'Speed Reader', description: 'Finish a book in one day', earned: false },
  ],
  wishlist: ['b5', 'b7', 'b8'],
};

export const books: Book[] = [
  {
    id: 'b1',
    title: 'The Wind Sailor',
    author: 'Maren Voss',
    genre: ['Adventure', 'Fiction'],
    readingLevel: 'Grades 3-5',
    rating: 4.6,
    yearPublished: 2019,
    totalCopies: 5,
    borrowedCopies: 2,
    coverColor: '#2A9D8F',
    coverAccent: '#264653',
    arPoints: 4,
    lexile: 730,
    reviewCount: 52,
    summary: 'A young sailor sets out alone to cross the Windward Strait, braving storms and sea legends to bring medicine back to her island home.',
  },
  {
    id: 'b2',
    title: 'Starlight Over Kepler',
    author: 'Idris Chen',
    genre: ['Science Fiction'],
    readingLevel: 'Grades 6-8',
    rating: 4.8,
    yearPublished: 2021,
    totalCopies: 3,
    borrowedCopies: 3,
    coverColor: '#4361EE',
    coverAccent: '#3A0CA3',
    series: true,
    arPoints: 7,
    lexile: 890,
    reviewCount: 88,
    summary: 'When a signal from a dying star reaches the Kepler colony, seventeen-year-old Idris must decode it before the colony\'s only ship runs out of fuel.',
  },
  {
    id: 'b3',
    title: 'The Riddle of Marrow Hollow',
    author: 'Peony Ashworth',
    genre: ['Mystery', 'Fiction'],
    readingLevel: 'Grades 3-5',
    rating: 4.3,
    yearPublished: 2017,
    totalCopies: 4,
    borrowedCopies: 1,
    coverColor: '#264653',
    coverAccent: '#1B3A4B',
    arPoints: 5,
    lexile: 760,
    reviewCount: 41,
    summary: 'Three cousins spend the summer unraveling a century-old riddle hidden in the walls of their grandmother\'s crumbling estate.',
  },
  {
    id: 'b4',
    title: 'Dragons of the Ember Coast',
    author: 'Idris Chen',
    genre: ['Fantasy', 'Adventure'],
    readingLevel: 'Grades 6-8',
    rating: 4.9,
    yearPublished: 2022,
    totalCopies: 6,
    borrowedCopies: 4,
    coverColor: '#9B5DE5',
    coverAccent: '#5A189A',
    series: true,
    arPoints: 8,
    lexile: 910,
    reviewCount: 104,
    summary: 'The ember-scaled dragons of the Coast have kept the peace for a thousand years — until a stranger arrives claiming to be their long-lost rider.',
  },
  {
    id: 'b5',
    title: 'A Life in Small Bright Rooms',
    author: 'Harriet Boone',
    genre: ['Biography', 'Non-Fiction'],
    readingLevel: 'Grades 9-12',
    rating: 4.1,
    yearPublished: 2015,
    totalCopies: 2,
    borrowedCopies: 0,
    coverColor: '#E76F51',
    coverAccent: '#9C3D24',
    arPoints: 9,
    lexile: 1020,
    reviewCount: 29,
    summary: 'A tender, unflinching memoir about growing up in post-war housing blocks and finding beauty in the ordinary corners of a hard childhood.',
  },
  {
    id: 'b6',
    title: 'The Paper Menagerie Club',
    author: 'Yuki Tanaka',
    genre: ['Fiction', 'Humor'],
    readingLevel: 'Grades 1-2',
    rating: 4.7,
    yearPublished: 2020,
    totalCopies: 8,
    borrowedCopies: 3,
    coverColor: '#F9C74F',
    coverAccent: '#C98A0A',
    arPoints: 2,
    lexile: 420,
    reviewCount: 67,
    summary: 'The Paper Menagerie Club folds their worries into origami animals — until one Friday, the animals start folding themselves back.',
  },
  {
    id: 'b7',
    title: 'When the Rivers Learned to Sing',
    author: 'Maren Voss',
    genre: ['Poetry'],
    readingLevel: 'Grades 6-8',
    rating: 4.4,
    yearPublished: 2018,
    totalCopies: 3,
    borrowedCopies: 1,
    coverColor: '#F15BB5',
    coverAccent: '#B5179E',
    arPoints: 3,
    lexile: 680,
    reviewCount: 18,
    summary: 'A collection of verse following a river from its mountain spring to the sea, giving voice to every creature and season along its banks.',
  },
  {
    id: 'b8',
    title: 'Empire of Salt and Glass',
    author: 'Odalys Marchetti',
    genre: ['History', 'Non-Fiction'],
    readingLevel: 'Grades 9-12',
    rating: 4.5,
    yearPublished: 2016,
    totalCopies: 4,
    borrowedCopies: 2,
    coverColor: '#00BBF9',
    coverAccent: '#0077B6',
    arPoints: 10,
    lexile: 1080,
    reviewCount: 35,
    summary: 'A sweeping history of the salt-trade empires that rose along the ancient coast, told through the eyes of merchants, sailors, and the glassblowers who outlasted them all.',
  },
];
