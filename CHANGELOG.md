# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Fixed orchestrator metrics to reflect running and active state after cycles.
- Module orchestrator skips execution when `MONGODB_URI` is missing, and instrumentation
  refrains from starting the orchestrator without it.
- Module orchestrator can be disabled via `MODULE_ORCHESTRATOR_DISABLED`.

## [0.5.3] - 2025-08-15

### Added
- AGENTS guideline to record significant changes in `CHANGELOG.md`.
- Module orchestrator service to monitor registered modules and prune stale entries.
- Module orchestrator now emits `module.online`, `module.offline`, and `module.removed` events with corresponding logs.
- Centralized logging utility.
- Documentation for module orchestrator options and events.
- Module orchestrator supports custom `pingPath` option.
- Validation to ensure `endpoints.rest` is a valid URL during module registration.
- Instrumentation to start the module orchestrator on server boot and stop it on shutdown.
- Module orchestrator publishes `orchestrator.cycle` metrics with online/offline counts and cycle duration.
- Dashboard views for `owner`, `admin` y `employee` que consumen `getModules` y se actualizan en tiempo real mediante eventos de módulo.
- Health endpoints:
  - `GET /api/health` returns aggregate status `{ status: 'ok'|'degraded'|'error', db, mq }` with HTTP `200/206/503`. MQ can be `disabled` when `RABBITMQ_DISABLED=true`.
  - `GET /api/health/db` checks MongoDB connectivity.
  - `GET /api/health/mq` checks RabbitMQ connectivity and asserts the default exchange.
- Orchestrator metrics endpoint: `GET /api/orchestrator/metrics` returns `{ status: 'ok', metrics: { online, offline, durationMs, timestamp, isActive, isRunning } }` or `{ status: 'stale' }` when no cycles yet.
- UI components:
  - `HealthStatus` to display aggregate health (polling cada 15s).
  - `OrchestratorMetrics` to display last orchestrator cycle metrics (polling cada 15s).
- Orchestrator instrumentation accepts `MODULE_ORCHESTRATOR_INTERVAL_MS` to configure the cycle interval and only runs on `NEXT_RUNTIME=nodejs`.
- Messaging helpers and infra:
  - RabbitMQ client with retry/backoff, graceful re-init on `close/error`, disabled mode via `RABBITMQ_DISABLED`, and defaults via `RABBITMQ_URL` and `RABBITMQ_EXCHANGE` (default `modules.exchange`).
  - `publish/subscribe` helpers with optional AJV schema validation and proper `ack/nack` handling.
  - Event bus publishes to the default exchange and uses per-subscriber ephemeral queues with UUID (Web Crypto fallback).
- Testing config: added `tsconfig.tests.json` to isolate test compilation.

### Changed
- Module orchestrator now pings modules in parallel before pruning.
- Module orchestrator pings now have a timeout using `AbortController` to mark modules offline on timeout.
- Module orchestrator uses the logging utility instead of `console`.
- Module orchestrator paginates using `_id` cursors instead of `skip` for improved efficiency.
- Module orchestrator includes an `Authorization` header with the module's integration token on ping requests.
- Health aggregate route now computes `degraded` state and maps it to HTTP `206`.
- MongoDB connector tolerates missing `MONGODB_URI` under `NODE_ENV=test` to ease stubbing during tests, and improves cached connection/error reset.

### Fixed
- Module orchestrator marks modules offline and skips ping when their `rest` endpoint URL is invalid.
- Module orchestrator publishes `module.offline` when ping URL is invalid.
- Module orchestrator runs sequentially, avoiding overlapping cycles and resetting its state on errors.
- Module orchestrator sorts modules by `_id` before pagination to ensure stable ordering.
- Module orchestrator sets `lastHandshake` when pings fail or URLs are invalid, enabling pruning of modules without previous handshakes.
- Module orchestrator now preserves subroutes when constructing ping URLs.
- Health endpoints return `disabled` for MQ when `RABBITMQ_DISABLED=true` instead of failing.

## [0.5.2] - 2025-08-11

### Added
- Guidance on interpreting and presenting `validateManifest.errors`

## [0.5.1] - 2025-08-10

### Added
- Tests for module manifest validation and model pre-save hook

## [0.5.0] - 2025-08-03

### Added
- Module manifest schema and validation
  - `src/lib/moduleManifest.ts` defines the manifest contract and AJV validation
  - `Module` model now includes `version` and `manifest` fields
- Architecture updated with `Schema Registry` and manifest documentation in README

### Changed
- Expanded README with module contracts, discovery flow and message broker usage

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
