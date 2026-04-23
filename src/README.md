# Frontend Architecture

This frontend uses a feature-ready, production-style structure with shared UI primitives and role-aware navigation.

## Folder overview

- `api/` - Axios clients and service modules for backend integration.
- `components/` - Reusable UI building blocks.
  - `UI.jsx` - Shared primitive components (`Toast`, `Alert`, `EmptyState`, `LoadingSpinner`, `StatusBadge`).
  - `Navbar.jsx` - Role-aware top navigation and notifications.
- `config/` - UI/runtime configuration.
  - `navigation.js` - Centralized role navigation maps.
- `context/` - App-level state providers (`AuthContext`).
- `pages/` - Route-level pages (candidate/recruiter/admin groups).

## UX standards

- Shared feedback primitives for loading, empty, error, and toast states.
- Token-based styling via `index.css` variables.
- Route transitions through `PageTransition` wrapper in `App.jsx`.
- Responsive behavior built into nav, cards, forms, and tables.

## Extending the app

- Add a new route page in `pages/`.
- Add corresponding link in `config/navigation.js`.
- Use `api/*` module for server calls and `UI.jsx` primitives for feedback.

