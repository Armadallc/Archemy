# Migration from Railway/Vercel to Render

## Overview

This guide helps you migrate HALCYON TMS from Railway (backend) + Vercel (frontend) to Render.com (both services).

## Migration Steps

### Step 1: Prepare Render Account

1. Sign up at https://render.com
2. Connect your GitHub account
3. Verify email address

### Step 2: Export Environment Variables

#### From Railway (Backend)

1. Railway Dashboard → Your Service → Variables
2. Copy all environment variables:
   - `NODE_ENV`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (if set)

#### From Vercel (Frontend)

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Copy:
   - `VITE_API_URL` (will need to update after backend deploys)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Step 3: Deploy Backend to Render

1. **Create Web Service**
   - Render Dashboard → New → Web Service
   - Connect GitHub repository
   - Use `render.yaml` (recommended) or manual setup

2. **Set Environment Variables**
   - Paste variables from Railway
   - Add `PORT=10000` (Render will override, but good to have)

3. **Deploy**
   - Render will build and deploy
   - Wait for deployment to complete
   - Note the backend URL: `https://halcyon-backend.onrender.com`

### Step 4: Deploy Frontend to Render

1. **Create Static Site**
   - Render Dashboard → New → Static Site
   - Connect GitHub repository
   - Use `render.yaml` (recommended) or manual setup

2. **Set Environment Variables**
   - `VITE_API_URL`: `https://halcyon-backend.onrender.com` (your backend URL)
   - `VITE_SUPABASE_URL`: From Vercel
   - `VITE_SUPABASE_ANON_KEY`: From Vercel

3. **Deploy**
   - Render will build and deploy
   - Wait for deployment to complete
   - Note the frontend URL: `https://halcyon-frontend.onrender.com`

### Step 5: Test Deployment

1. **Backend Health Check**
   ```bash
   curl https://halcyon-backend.onrender.com/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Frontend Access**
   - Open `https://halcyon-frontend.onrender.com`
   - Try logging in
   - Verify API calls work (check browser console)

3. **WebSocket Test**
   - Open browser console
   - Check for WebSocket connection to `/ws`
   - Verify real-time updates work

### Step 6: Update CORS (If Needed)

The code already includes Render CORS support (`*.onrender.com`), but verify:

1. Check `server/index.ts` has Render domain in CORS
2. If using custom domains, add them to CORS

### Step 7: Update Documentation

1. Update any hardcoded URLs in documentation
2. Update team members on new deployment URLs
3. Update any external integrations (webhooks, etc.)

## Rollback Plan

If issues occur, you can quickly rollback:

### Option 1: Keep Both Running
- Keep Railway/Vercel running during migration
- Switch DNS/URLs when ready
- No downtime

### Option 2: Quick Rollback
- Railway/Vercel deployments remain in history
- Can redeploy previous version if needed

## Differences: Railway/Vercel vs Render

### Backend

| Feature | Railway | Render |
|---------|---------|--------|
| Free Tier | Yes | Yes |
| Spin-down | No | Yes (15 min) |
| Cold Start | Fast | ~30-60s after spin-down |
| WebSocket | Yes | Yes |
| Custom Domain | Yes | Yes |

### Frontend

| Feature | Vercel | Render |
|---------|--------|--------|
| Free Tier | Yes | Yes |
| Spin-down | No | Yes (15 min) |
| CDN | Global | Regional |
| Build Time | Fast | Moderate |
| Custom Domain | Yes | Yes |

## Common Issues

### Backend Spins Down

**Problem**: Backend unavailable after 15 minutes of inactivity

**Solutions**:
1. Upgrade to paid tier ($7/month) for always-on
2. Use a ping service to keep it alive
3. Accept cold starts for development

### CORS Errors

**Problem**: Frontend can't connect to backend

**Solutions**:
1. Verify `VITE_API_URL` is correct
2. Check backend CORS includes Render domains
3. Ensure both services are deployed

### WebSocket Disconnects

**Problem**: WebSocket connection drops

**Solutions**:
1. Backend may have spun down (free tier)
2. Upgrade to paid tier for always-on
3. Implement reconnection logic in frontend

## Post-Migration Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Login works
- [ ] API calls succeed
- [ ] WebSocket connects
- [ ] Real-time updates work
- [ ] Environment variables set correctly
- [ ] Custom domains configured (if needed)
- [ ] Team notified of new URLs
- [ ] Documentation updated

## Cost Comparison

### Current Setup (Railway + Vercel)
- Railway: Free tier (or paid)
- Vercel: Free tier (or paid)
- **Total**: $0-14/month

### Render Setup
- Backend: Free tier (or $7/month)
- Frontend: Free tier (or $7/month)
- **Total**: $0-14/month

**Note**: Render free tier spins down, Railway/Vercel don't. For production, consider paid tiers.

## Next Steps

1. Monitor both deployments for a few days
2. Test all features thoroughly
3. Consider upgrading to paid tier for production
4. Archive Railway/Vercel deployments (keep for reference)

---

**Questions?** See `RENDER_DEPLOYMENT.md` for detailed deployment guide.

