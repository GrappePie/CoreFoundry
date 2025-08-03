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

## [0.4.0] - 2025-08-03

### Added
- Enhanced Mongoose models with timestamps, soft-delete and pagination:
  - User model: added fields (`role`, `subscription`, `modulesEnabled`, `lastLogin`, `emailVerified`, `status`, `subscriptionStart`, `subscriptionEnd`, `deletedAt`), password hashing hook, `comparePassword` method, `toJSON` transform, `mongoose-paginate-v2` plugin and indexes.
  - Module model: new schema with `ownerId`, `schema` (AJV validation), `endpoints`, `deletedAt`, timestamps, pagination plugin and indexes.
  - ModuleLink model: new schema with `fromModule`, `toModule`, `mappingRules` (AJV validation), `deletedAt`, timestamps, pagination plugin and indexes.
  - AuditLog model: new schema with `userId`, `action`, `payload`, `result`, `ipAddress`, `userAgent`, `moduleId`, `endpoint`, `errorCode`, `errorStack`, timestamps, pagination plugin, indexes and TTL index (expire after 30 days).
- JSON schema validation in models using Ajv for `Module.schema` and `ModuleLink.mappingRules`.
- Install and configure `mongoose-paginate-v2` for all models.
- Soft-delete support via `deletedAt` fields and queries excluding soft-deleted documents.
- Refactored authentication endpoints with Zod (fail-fast validation):
  - Added `zod` schemas in `/api/auth/register` and `/api/auth/login`, returning structured `issues` on errors.
  - Installed `zod` and updated response handling to use `error.issues`.
- Updated `useAuth` hook to capture and propagate validation issues to client.
- Updated `AuthForm` component to display Zod validation errors.

### Dependencies
- `bcryptjs` and `@types/bcryptjs` for password hashing
- `ajv` for JSON schema validation
- `mongoose-paginate-v2` for pagination
- `zod` for request validation

*For more details, see individual commit messages.*
