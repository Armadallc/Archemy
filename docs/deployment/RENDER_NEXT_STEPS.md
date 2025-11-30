# Render Deployment - Next Steps

## ✅ Current Status
- `render.yaml` detected on `main` branch
- Render Blueprint ready to deploy

## Step-by-Step Deployment

### 1. Review Blueprint Services

Render should show two services:
- **halcyon-backend** (Web Service)
- **halcyon-frontend** (Static Site)

### 2. Set Environment Variables

#### Backend Service (`halcyon-backend`)

Go to the backend service → Environment tab, add:

```
SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg0NTUzMSwiZXhwIjoyMDc0NDIxNTMxfQ.p43LNk28V9bTfvWsbdW8ByZw_lb26-IKoDrHxkvp9fg
SESSION_SECRET=generate-a-random-secret-string-here
```

**Note:** `NODE_ENV` and `PORT` are already set in `render.yaml`.

#### Frontend Service (`halcyon-frontend`)

Go to the frontend service → Environment tab, add:

```
VITE_SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4
```

**Important:** `VITE_API_URL` needs to be set AFTER backend deploys:
1. Wait for backend to deploy
2. Copy the backend URL (e.g., `https://halcyon-backend.onrender.com`)
3. Add to frontend environment: `VITE_API_URL=https://halcyon-backend.onrender.com`

### 3. Deploy Services

1. Click **"Apply"** or **"Create"** in the Blueprint
2. Backend will deploy first (~2-3 minutes)
3. Once backend is live, copy its URL
4. Add `VITE_API_URL` to frontend environment variables
5. Frontend will deploy (~2-3 minutes)

### 4. Verify Deployment

#### Backend Health Check
```bash
curl https://halcyon-backend.onrender.com/api/health
```

Expected response:
```json
{"status":"healthy","timestamp":"...","environment":"production"}
```

#### Frontend Access
- Open: `https://halcyon-frontend.onrender.com`
- Try logging in
- Check browser console for errors

#### WebSocket Test
- Open browser console
- Look for WebSocket connection to `/ws`
- Verify real-time updates work

### 5. Common Issues

#### Backend Won't Start
- Check logs in Render Dashboard
- Verify all environment variables are set
- Check Supabase credentials are correct

#### Frontend Shows Blank Page
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check build logs in Render Dashboard

#### CORS Errors
- Verify backend URL in `VITE_API_URL`
- Check that backend CORS includes `*.onrender.com`
- Ensure both services are deployed

### 6. Free Tier Notes

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds (cold start)
- 750 hours/month free (plenty for development)

### 7. Upgrade to Paid (Optional)

For production, consider upgrading:
- **Starter Plan**: $7/month per service
- Always-on (no spin-down)
- Faster cold starts
- More resources

---

**Need Help?** See `RENDER_DEPLOYMENT.md` for detailed troubleshooting.

