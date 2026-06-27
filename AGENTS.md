## Goal
Build and maintain Clipflow — an AI video/image studio with Next.js frontend and Modal GPU backend.

## Constraints & Preferences
- Dark theme only
- All ComfyUI prompts in English
- Most users sign up via Google OAuth → needs `profiles` table in Supabase

## Progress
### Done
- **Ideogram 4 generation works end-to-end** — ComfyUI 0.24.0 natively includes all node types
- **20 credits for all users** — existing users bumped, SQL files updated, trigger function needs manual update
- **Landing page overhaul** — animated gradient hero, glassmorphism cards, scroll animations, powered-by model strip
- **Auto Agent in sidebar** — sidebar now exclusively shows the Agent chat panel (no other nav items). Prompt input + Send/Create buttons pinned to bottom
- **Studio sidebar fully wired** — `StudioSidebar` rendered in studio page with `SidebarProvider`/`SidebarInset`
- **Deployed to Vercel** — `https://aivid1-replace-genkit-with-openrout.vercel.app`

### In Progress
- UI redesign requested

### Blocked
- **Database trigger function** for new user credits (set to 20) — needs manual SQL run in Supabase SQL Editor
- **Ideogram 4 safety filter** — baked into model weights; sigma shift/two-stage workaround deferred

## Key Decisions
- Agent state lives in `StudioSidebar` (self-contained), communicates via callbacks for jobs/credits
- No navigation items in studio sidebar — purely the Auto Agent panel
- Prompt bar at bottom of sidebar using `mt-auto` + flex layout

## Relevant Files
- `src/components/studio-sidebar.tsx` — auto agent sidebar with pinned bottom input
- `src/app/studio/[id]/page.tsx` — studio layout with `SidebarProvider`, `StudioSidebar`, `SidebarInset`
- `supabase/profiles-table.sql` — default credits changed from 10 to 20
- `supabase/credits-20-migration.sql` — one-time migration for existing profiles + trigger update
