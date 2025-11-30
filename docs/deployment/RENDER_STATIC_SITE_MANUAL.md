# Render Static Site - Manual Setup Required

## Important: Static Sites Not Supported in Blueprint

Render's Blueprint YAML (`render.yaml`) **does not support static sites**. Only these service types are supported:
- `web` - Web services
- `background_worker` - Background workers
- `psql` - PostgreSQL databases
- `redis` - Redis instances

## Solution: Manual Static Site Creation

After the backend deploys via Blueprint, create the frontend static site manually:

### Step 1: Backend Deploys First

The `render.yaml` will deploy the backend automatically. Wait for it to complete and note the URL:
- Example: `https://halcyon-backend.onrender.com`

### Step 2: Create Static Site Manually

1. **Render Dashboard** → **New +** → **Static Site**

2. **Connect Repository**
   - Connect your GitHub account
   - Select the `HALCYON` repository
   - Branch: `main` (or your deployment branch)

3. **Configure Build**
   - **Name**: `halcyon-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free

4. **Environment Variables**
   Add these in the Environment tab:
   ```
   VITE_API_URL=https://halcyon-backend.onrender.com
   VITE_SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **SPA Routing**
   - Render automatically handles SPA routing for static sites
   - All routes will serve `/index.html` (React Router will handle routing)

6. **Deploy**
   - Click **Create Static Site**
   - Wait for deployment (~2-3 minutes)

### Step 3: Verify

1. Open your static site URL: `https://halcyon-frontend.onrender.com`
2. Try logging in
3. Check browser console for errors
4. Verify API calls work

## Alternative: Use Backend to Serve Frontend

If you want everything in one service, you can modify the backend to serve the built frontend:

1. Build frontend locally: `cd client && npm run build`
2. Copy `dist` to `server/public` or similar
3. Backend serves static files (already configured in `server/index.ts`)

This approach uses only one Render service but requires building frontend before backend deployment.

---

**Recommendation**: Use manual static site creation for cleaner separation and easier updates.

