# Calm Route Planner Tech Stack

## Frontend
- **React 19** with **TypeScript**
- **TanStack Start** for app framework and SSR routing (`@tanstack/react-start`, `@tanstack/react-router`)
- **TanStack Query** for client-side async data handling
- **Vite 8** for development and builds
- **Tailwind CSS 4** for styling
- **Radix UI** primitives plus utility libs like `class-variance-authority`, `clsx`, and `tailwind-merge`

## Maps and Geospatial
- **Leaflet** for interactive maps (browser-only loading via `RouteMap`)
- **Turf** utilities for route and geometry analysis

## Backend and APIs
- **TanStack server functions** (`createServerFn`) for authenticated server-side actions
- Optional external **SafeRoute Express backend** integration via `src/lib/saferouteApi.ts`
- Built-in Google Routes/Places integration through the Lovable connector gateway (`src/lib/engine.server.ts`)

## Data, Auth, and Persistence
- **Supabase** (`@supabase/supabase-js`) for auth, database access, and row-level security backed data
- **Lovable Cloud auth** integration (`@lovable.dev/cloud-auth-js`)
- Local device caching with `localStorage`, synced to Supabase tables for signed-in users

## AI and Safety Features
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/openai-compatible`) for AI-powered features
- Server-validated/community moderation flows persisted in Supabase

## Tooling
- **ESLint** + **Prettier** for linting and formatting
- **Vitest** for tests
- **Drizzle Kit/ORM** configured for PostgreSQL migrations/tooling
