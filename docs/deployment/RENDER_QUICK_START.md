# Render.com Quick Start Guide

## 5-Minute Setup

### Step 1: Connect Repository

1. Go to https://render.com
2. Sign up / Log in
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub account
5. Select the `HALCYON` repository
6. Render will detect `render.yaml` automatically

### Step 2: Set Environment Variables

#### Backend Service

In the backend service settings, add:

```
SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SESSION_SECRET=generate-a-random-string-here
```

#### Frontend Service

In the frontend service settings, add:

```
VITE_SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: `VITE_API_URL` will be auto-set from the backend service URL.

### Step 3: Deploy

1. Click **"Apply"** in the Blueprint
2. Render will create both services
3. Backend deploys first (~2-3 minutes)
4. Frontend deploys after (~2-3 minutes)

### Step 4: Test

1. Wait for both services to show "Live"
2. Open your frontend URL: `https://halcyon-frontend.onrender.com`
3. Try logging in
4. Check browser console for errors

## Troubleshooting

### Services Won't Start

- Check logs in Render Dashboard
- Verify environment variables are set
- Ensure Supabase credentials are correct

### CORS Errors

- Verify backend URL is correct in `VITE_API_URL`
- Check that both services are deployed
- Wait a few minutes for DNS propagation

### Frontend Shows Blank Page

- Check browser console for errors
- Verify `dist` directory is being created
- Check build logs in Render Dashboard

## Next Steps

- See `RENDER_DEPLOYMENT.md` for detailed guide
- See `RENDER_MIGRATION.md` for migrating from Railway/Vercel

