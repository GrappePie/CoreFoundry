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

*For more details, see individual commit messages.*
