# HALCYON (old)

## Overview
This project is a full-stack, multi-tenant limo service management system. It supports web and mobile applications with real-time trip management, driver tracking, and comprehensive vehicle management. The system is designed for multi-tenant organizations like Monarch Competency, Monarch Mental Health, Monarch Sober Living, and Monarch Launch, providing isolated data and role-based access control. The business vision is to provide a robust, scalable solution for transport management, with market potential in various service-based organizations requiring fleet and trip coordination.

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX Preferences: Loves the combined Trip Management page with horizontal split layout - prefers unified interfaces over separate pages for related functionality.
Development workflow: Prefers to stay logged in during development to avoid re-entering credentials after code changes - values efficiency in testing workflow.

## System Architecture
The system employs a full-stack monorepo structure.
- **Frontend**: React web application using TypeScript and Tailwind CSS.
- **Backend**: Express.js API server with session-based authentication.
- **Mobile**: React Native mobile app for drivers (planned/partially implemented).
- **Database**: Supabase PostgreSQL with row-level security.
- **Shared**: Common TypeScript schemas and utilities.

It is designed with a multi-tenant architecture, ensuring data isolation and access control for distinct organizations. Authentication is session-based using Express sessions and secure cookies, with a robust role-based access control system including `super_admin`, `monarch_owner`, `organization_admin`, `organization_user`, and `driver` roles. An enhanced permission system provides granular control, and organization-based data filtering ensures users only access authorized information.

Database schema consistently uses `snake_case` field names (`user_id`, `primary_organization_id`, `organization_id`), and authentication relies on exact database field names, never converting to `camelCase` during authentication flows. The recurring trip architecture uses `recurring_trips` as master templates and `trips` for individual instances, ensuring a single source of truth.

Core entities include Organizations, Users, Drivers, Clients, Trips, Vehicles, and Service Areas. Data flow for authentication involves server-side validation and session creation. Trip management includes real-time updates via WebSocket connections. Data access patterns are implemented for `Super Admin` (cross-organizational), `Organization Users` (primary organization filtering), and `Drivers` (assigned trip filtering).

UI/UX decisions include the use of Shadcn/UI for components, Radix UI primitives, and Tailwind CSS for styling. The design aims for a unified interface experience, as exemplified by the combined Trip Management page.

## External Dependencies
- **Supabase**: PostgreSQL database for data storage, authentication, and real-time subscriptions.
- **Express Sessions**: For server-side session management.
- **Bcrypt**: For secure password hashing (12 rounds).
- **React Query**: For data fetching and caching in the frontend.
- **Shadcn/UI**: Component library.
- **React Hook Form**: For form management with Zod validation.
- **Tailwind CSS**: For utility-first styling.
- **React Native**: (Planned) For cross-platform mobile development.
- **Expo**: (Planned) Development toolchain for mobile.
- **React Navigation**: (Planned) Navigation library for mobile.
- **Ritten.io**: Webhook integration for transport-related appointments.
