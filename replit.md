# S.A.L.I.M. Platform

Application web SaaS pour la méthode de développement personnel S.A.L.I.M. (Specify → Align → Lay out → Implement → Maintain). MVP v1 — freemium, un objectif à la fois, progression verrouillée.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 → proxied at /api)
- `pnpm --filter @workspace/salim run dev` — run the frontend (port 22760 → proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + JWT auth (`SESSION_SECRET`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Wouter (routing) + TanStack Query + Tailwind v4 + shadcn/ui
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, objectives, specify, align, plans, milestones, tasks, reviews, habits, journal)
- `lib/api-client-react/src/generated/api.ts` — generated TanStack Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/salim/src/pages/` — all frontend pages
- `artifacts/salim/src/components/layout.tsx` — AppLayout sidebar

## Architecture decisions

- JWT stored in `localStorage` as `salim_token`; `setAuthTokenGetter` wires token to all API calls
- Step progression enforced server-side: `updateObjectiveStep()` in `salim-steps.ts` advances `currentStep` and tracks `completedSteps[]`
- When "maintain" step is completed, objective `status` automatically set to `"completed"`
- Onboarding detection: if user has 0 objectives → redirect to `/onboarding`; after registration always → `/onboarding`
- Freemium: `users.plan` field (`free` | `premium`); S+A steps available free, I+M behind premium
- One active objective at a time enforced via `GET /api/objectives/active`

## Product

**MVP v1 — Fonctionnalités incluses:**
1. **Onboarding conscient** — accueil, 3 questions de mission, choix d'objectif, engagement symbolique
2. **S — Specify** — formulaire SMART guidé (5 questions), score de précision, validation verrouillée
3. **A — Align** — Pourquoi profond, valeurs personnelles, visualisation guidée, score d'alignement
4. **L — Lay Out** — Plan 90 jours, jalons par mois, priorité focus, validation
5. **I — Implement** — 1 action prioritaire/jour, marquer fait/non-fait, revue hebdomadaire (3 questions fixes)
6. **M — Maintain** — suivi habitudes clés, indicateurs de constance, progression perçue
7. **Journal personnel** — entrées libres avec suggestions de réflexion, humeur, historique chronologique
8. **Parcours complet** — écran de clôture non-euphorique avec leçon apprise, invitation au prochain cycle
9. **Paramètres** — profil, mission, notifications toggle, aide méthode SALIM

**Fonctionnalités exclues du MVP:** gamification, communauté, coaching IA, audio/vidéo, multi-objectifs, stats avancées.

## User preferences

- Application principalement en **français**
- Philosophie: pas de gamification, pas de comparaison sociale, discipline douce, respect du rythme humain
- Ton sobre, non culpabilisant, professionnel

## Gotchas

- Don't run `pnpm dev` at workspace root — use workflow restart or filter commands
- After OpenAPI spec changes: run `pnpm --filter @workspace/api-spec run codegen` before frontend changes
- `tsc --noEmit` for frontend/backend; `tsc --build` only for composite libs
- The `/api` path prefix is handled by the reverse proxy; API server listens without prefix on its local port

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB push: `pnpm --filter @workspace/db run push`
