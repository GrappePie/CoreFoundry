# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-08-02

### Added
- Login and registration functionality
  - Created `/login` and `/register` pages in the Next.js `app` directory
  - Built `AuthForm` component to handle form inputs and submission
  - Implemented API routes for authentication:
    - `/api/auth/register/route.ts`
    - `/api/auth/login/route.ts`
    - Integrated NextAuth's `[...nextauth]/route.ts` for session management
- State management with Zustand
  - Added `src/store/authStore.ts` to manage user authentication state
  - Exposed actions for login, logout, and session persistence
- Data fetching with TanStack Query
  - Installed and configured TanStack Query (React Query) for asynchronous data management
  - Wrapped application in `QueryClientProvider` within `Providers.tsx`
  - Created custom hooks to fetch user data and handle query states

### Dependencies
- `zustand`
- `@tanstack/react-query`
- `next-auth`

## [0.3.0] - 2025-08-03

### Added
- AuthMenu component for displaying user options
- ChatWidget component for real-time chat integration
- InfiniteScroller component for lazy loading content
- Static pages: Privacy (`/privacy`), Terms (`/terms`), Profile (`/profile`)
- Providers component for wrapping app with authentication and data fetching contexts
- Custom hook `useAuth` for accessing authentication state
- MongoDB connection utility (`lib/mongodb.ts`)
- Mongoose User model (`models/User.ts`)
- Landing page with hero section, feature highlights, modules showcase, subscription plans, business examples, and FAQ accordion

### Changed
- Updated global layout to include Providers and AuthMenu
- Improved styling and responsiveness for authentication forms and overall UI

### Dependencies
- `mongoose`

*For more details, see individual commit messages.*
