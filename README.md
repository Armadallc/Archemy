# HALCYON Transport Management

Modern, multi-tenant transport management system for organizations like Monarch Competency, built with a TypeScript mono-repo: React (web), Express (API), Supabase (Postgres/Auth/Storage), and an Expo React Native mobile app for drivers.

## Contents
- Overview and Architecture
- Quick Start (Local Dev)
- Environment Configuration
- Database (Supabase) and Migrations
- Sample Data and Scripts
- Mobile App (Drivers)
- Development Workflow, Safeguards, and Protocols
- Documentation Map
- Coding Standards and UI
- Security, HIPAA, and RLS
- Contributing, Branching, and Commit Style

---

## Overview and Architecture
- Multi-tenant hierarchy: corporate client → programs → locations → clients/drivers/vehicles
- Web app: React + Vite + shadcn/Radix + Tailwind
- API: Express + Supabase client (Postgres, Auth, Storage)
- ORM and shared types: Drizzle + `shared/schema.ts`
- Mobile: Expo/React Native app for drivers
- Real-time features: Websocket hooks for live operations (drivers, trips)

Key directories:
- `client/` – Web app (Vite + React + shadcn)
- `server/` – Express API, Supabase integration, permissions
- `mobile/` – Driver mobile app (Expo Router)
- `shared/` – Shared types/schemas
- `migrations/` & `legacy-reference/migrations` – SQL migrations
- `daily-logs/` – Session logs and next-session handoff
- Root docs – consolidated architecture, setup, and guides

---

## Quick Start (Local Dev)
Prereqs: Node 18+, npm, psql (optional), Supabase project.

1) Install dependencies
```bash
npm install
```

2) Start backend and web client (concurrently)
```bash
npm run dev
```
- Server: http://localhost:8081
- Web:    http://localhost:5173

3) Development credentials (do not change)
- Super Admin: admin@monarch.com / admin123
- Driver:      driver@monarch.com / driver123

If auth fails or dashboard shows 401s, ensure the backend is running and `.env` is configured (see below).

---

## Environment Configuration
Create `.env` at repo root (see `SUPABASE_SETUP.md` for details):
```env
# Server
PORT=8081
SUPABASE_URL=...            # from Supabase Settings > API
SUPABASE_SERVICE_ROLE_KEY=...  # service_role key (secret)
JWT_SECRET=dev-secret

# Client
VITE_API_BASE_URL=http://localhost:8081
VITE_SUPABASE_URL=...       # anon URL if needed client-side
VITE_SUPABASE_ANON_KEY=...
```
Mobile app env (`mobile/.env`):
```env
EXPO_PUBLIC_API_URL=http://localhost:8081
```

---

## Database (Supabase) and Migrations
- Schema uses snake_case (immutable) and UUID primary keys
- Drizzle schemas in `shared/schema.ts`
- SQL bootstrap/migrations in `server/*.sql` and `migrations/`

Initial setup summary (see `SUPABASE_SETUP.md`):
- Create Supabase project
- Apply schema SQL (tables, RLS, policies)
- Configure Auth (Email/Password enabled; dev email confirmations off)
- Add program `short_name` column if not present

To verify RLS/health:
```bash
./verify-system.sh
node test-system-health.js
```

---

## Sample Data and Scripts
Helpful scripts (see `scripts/` and root SQL/JS tools):
- `create-supabase-users.js` – seed Supabase Auth users
- `create-single-test-trip.js`, `create-second-test-trip.js`
- `test-system-health.js` – checks core endpoints
- `test-frequent-locations-*.js` – fixtures for locations

Run selected script
```bash
./scripts/rollback-safeguards.sh validate  # health
node create-single-test-trip.js            # example
```

---

## Mobile App (Drivers)
See `MOBILE_APP_GUIDE.md` for full details.
Quick start:
```bash
cd mobile
npm install
npx expo start
```
Driver login uses existing backend auth and shows assigned trips, real-time updates, status changes, and emergency tools.

---

## Development Workflow, Safeguards, and Protocols
Before making changes, review:
- `DEVELOPMENT_SAFEGUARDS.md` – critical protections, super admin dashboard guardrails, pre/post change checklists, rollback
- `INVESTIGATION_PROTOCOL.md` – use the `INVESTIGATE_FIRST` trigger for risky/debug work
- `DEVELOPMENT_WORKFLOW_SETUP.md` – daily flow and helper scripts

Branching:
- `main` – production-ready
- `develop` – integration branch
- `feature/*` – new features
- `hotfix/*` – urgent fixes

Suggested commit style:
- `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `chore: ...`

---

## Documentation Map (Consolidated)
- Project status: `PROJECT_STATUS.md`
- Supabase setup: `SUPABASE_SETUP.md`
- Development safeguards: `DEVELOPMENT_SAFEGUARDS.md`
- Dashboard reference: `DASHBOARD_DOCUMENTATION.md`
- Mobile app guide: `MOBILE_APP_GUIDE.md`
- Permissions/roles: `ENHANCED_PERMISSIONS_GUIDE.md`
- Styling/UX: `STYLING_GUIDE.md`

---

## Coding Standards and UI
- TypeScript everywhere; prefer explicit types on public APIs
- UI: shadcn/Radix + Tailwind; custom Nohemi fonts in `public/fonts/`
- Forms: React Hook Form + Zod
- Components: Prefer composition, small props, and role-aware rendering

---

## Security, HIPAA, and RLS
- HIPAA-aware storage in Supabase (see `SUPABASE_STORAGE_DOCUMENTATION.md` and `SUPABASE_STORAGE_IMPLEMENTATION_GUIDE.md`)
- 7-year retention, audit logging, role-based access
- Strict snake_case database fields; no camelCase in queries
- Super admin dashboard has explicit role validation; do not bypass guards

---

## Contributing
1) Create a feature branch from `develop`
2) Follow investigation protocol for risky changes
3) Keep changes small and verifiable; use checkpoints
4) Open PR to `develop`; request review

License: Proprietary (internal project)
