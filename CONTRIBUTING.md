# Contributing

## Branching
- `main`: protected, release‑ready
- `develop`: default working branch
- `feature/<name>`: new work; open PR into `develop`
- `hotfix/<name>`: urgent fixes

## Commit style
Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

## Pre-commit safeguards
- Protected files (auth, API, migrations, super admin dashboard) require `APPROVED` in commit message
- Docs-only commits may bypass heavy checks

## Local checks
```bash
npm run dev         # start server + client
# In client/
npx tsc --noEmit
# In server/
npx tsc --noEmit
```

## PR requirements
- Build passes
- Typechecks pass
- No auth regressions (super admin login works)
- Dashboard loads without 401s
- Update docs if user-facing changes
