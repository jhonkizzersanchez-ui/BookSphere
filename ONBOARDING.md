# BookSphere — Setup to Hero

A guide to get BookSphere running locally and understand the codebase well enough to extend it. BookSphere is a school library management app with three roles — Student, Teacher, Librarian — each with their own dashboard and permissions.

## 1. Prerequisites

- Node.js 20+ (Node 25 is what this project was built and tested with)
- npm (comes with Node)
- Git

## 2. Setup

Clone the repo:

```bash
git clone https://github.com/jhonkizzersanchez-ui/BookSphere.git
cd BookSphere
```

Install dependencies:

```bash
npm install
```

This installs React 19, Vite 8, TypeScript, and Tailwind CSS v4 (via the `@tailwindcss/vite` plugin — no separate `tailwind.config.js` needed, theme tokens live in `src/index.css`).

## 3. Running the app

```bash
npm run dev
```

Opens the Vite dev server (defaults to `http://localhost:5173`, or the next free port). Hot module reload is on — edits to any `.tsx`/`.ts`/`.css` file reflect instantly in the browser.

Other scripts:

| Command | Purpose |
|---|---|
| `npm run build` | Type-checks and produces a production build in `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |

To type-check without building: `npx tsc -b --noEmit`.

## 4. Logging in

The app opens on a role-selection login screen. There's no real backend — auth is a hardcoded demo:

| Role | ID / Username | Password |
|---|---|---|
| Student | `202407001` | `student123` |
| Teacher | `ms.chen` | `teacher123` |
| Librarian | `mr.okafor` | `library2024` |

Each role lands on a different home view after login (see routing below). The login screen also has working (but non-persistent) Sign Up and Forgot Password flows — they simulate success states but don't create real accounts.

## 5. Project structure

```
src/
  App.tsx              - root component: routing, layout shell, toasts
  data.ts               - all mock data: books, students, badges, color maps
  index.css             - Tailwind import + global styles + font imports
  main.tsx              - React entry point
  components/
    Navbar.tsx           - top bar: logo, search, catalog shortcut, user menu
    BookCover.tsx        - reusable book cover (CSS gradient, no images)
  screens/
    Login.tsx            - login / signup / forgot-password flows
    StudentDashboard.tsx  - student home: borrowed books, badges, recommendations
    TeacherDashboard.tsx  - teacher home: class roster, reading lists, requests
    LibrarianPanel.tsx    - librarian home: manage books, students, reports
    BookCatalog.tsx       - browsable catalog with filter sidebar
    BookDetails.tsx       - single book page: stats, reviews, similar books
    MyBooks.tsx           - student's borrowed / history / wishlist tabs
    SearchResults.tsx     - search results with filter chips
```

There is no backend, no database, and no routing library (no React Router). Everything is one page app with view-swapping state in `App.tsx`.

## 6. How routing works

`App.tsx` owns a single piece of state:

```ts
const [view, setView] = useState<View>('login');
```

`View` is a string union of every screen name (`'login' | 'student-dashboard' | 'catalog' | 'book-details' | ...`, defined at the top of `App.tsx`). Navigating is just calling:

```ts
const navigate = (newView: View, bookId?: string) => {
  setView(newView);
  if (bookId) setSelectedBookId(bookId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

Every screen receives `onNavigate` as a prop and calls it instead of using links or a router. `App.tsx`'s JSX is a flat list of `{view === 'x' && <X />}` conditionals — only one screen renders at a time.

**Role gating**: some views are role-specific (`StudentDashboard` only renders `if role === 'student'`). The nav items shown in the sidebar/top bar also change per role — see `navByRole` in `App.tsx`.

## 7. The data model

Everything lives in `src/data.ts`, no API calls. Key exports:

- **`books: Book[]`** — the catalog. Each book has `genre`, `readingLevel`, `rating`, `reviewCount`, `totalCopies`/`borrowedCopies` (availability = `totalCopies - borrowedCopies`), and optional `reviews[]`, `series`.
- **`currentStudent`** — the logged-in student's state: `borrowedBooks`, `readingHistory`, `wishlist`, `badges`, `readingStreak`. This is what `StudentDashboard`, `MyBooks`, and `BookDetails` read from.
- **`classStudents: ClassStudent[]`** — roster used by `TeacherDashboard` and `LibrarianPanel`.
- **`levelColors`** / **`genreColors`** — color lookup tables so reading-level and genre tags render consistent colors everywhere (pass a `ReadingLevel` or genre string in, get back `{ bg, text, border }` or a hex).

Everything here is static mock data. "Borrowing" a book, submitting a review, etc. don't mutate `data.ts` — they just fire a toast via `onToast(...)`. If you want actions to actually persist, that's the seam where you'd introduce real state management or a backend.

## 8. Design system conventions

No component library — everything is hand-rolled Tailwind + inline hex colors. Conventions to follow when adding UI:

- **Headings** use `fontFamily: "'Baloo 2', sans-serif"` (loaded via Google Fonts in `index.css`); body text uses the default Inter.
- **Color palette** is hardcoded hex, not Tailwind's default palette — e.g. teal `#2A9D8F` (primary/student), blue `#4361EE` (teacher), purple `#9B5DE5` (librarian), orange `#F4A261` (accent), off-white background `#FDFBF7`.
- **Cards**: `bg-white rounded-2xl border border-[#E8EDF0] p-4` is the standard card shell used throughout.
- **Pills/tags**: `text-xs font-bold px-2.5 py-1 rounded-full` with a light background + matching darker text color (see `levelColors` usage).
- Tailwind v4 is configured via `@theme` in `index.css`, not a `tailwind.config.js` file — if you need new design tokens (fonts, colors), add them there.

## 9. Extending the app

**Add a new book to the catalog**: add an entry to the `books` array in `data.ts` following the existing `Book` shape. It'll automatically show up in `BookCatalog`, `SearchResults`, and be borrowable from `BookDetails`.

**Add a new screen**: 
1. Create `src/screens/YourScreen.tsx` with `onNavigate`/`onToast` props (match the pattern in existing screens).
2. Add a new value to the `View` union type in `App.tsx`.
3. Add a `{view === 'your-view' && <YourScreen ... />}` line in `App.tsx`'s `<main>`.
4. If it needs a nav entry, add it to the relevant array in `navByRole` (`App.tsx`).

**Add a new role capability**: role-specific UI branches on the `role` prop (see `BookDetails.tsx`'s three different action-button blocks per role, or `App.tsx`'s `navByRole`/`roleAccent` maps).

## 10. Known gaps (by design, not bugs)

- No persistence — refreshing the page resets all state to the initial login screen.
- No real authentication, API, or database.
- Actions like "Borrow", "Renew", "Submit review" only show a toast; they don't mutate `data.ts`.
- Dates are hardcoded relative to `2024-03-23` in a few places (e.g. overdue calculations) rather than using `Date.now()`, since the mock data's due dates are fixed to that timeframe.
