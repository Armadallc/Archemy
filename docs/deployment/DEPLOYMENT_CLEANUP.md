# Deployment Cleanup - Railway & Vercel Files

## Files Removed (Migrated to Render)

### Railway Files (No Longer Used)
- `railway.json` - Railway configuration
- `.railwayignore` - Railway ignore file
- All `RAILWAY_*.md` documentation files in `docs/deployment/`

### Vercel Files (No Longer Used)
- `vercel.json` - Vercel configuration (kept for reference in case needed later)
- `.vercelignore` - Vercel ignore file
- All `VERCEL_*.md` documentation files in `docs/deployment/`

## Current Deployment Platform

**Render.com** - Both frontend and backend deployed on Render
- Backend: `halcyon-backend.onrender.com`
- Frontend: `halcyon-frontend.onrender.com`

## Active Deployment Files

- `render.yaml` - Render Blueprint configuration
- `Dockerfile` - Backend Docker configuration (used by Render)
- `docs/deployment/RENDER_*.md` - Render deployment documentation

---

**Note:** Railway and Vercel files were removed after successful migration to Render.

