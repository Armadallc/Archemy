# Backend Server Connection Guide

## 🚀 Quick Start

### Current Status
- **Backend Server:** ✅ Running on port **8081**
- **Frontend (Vite):** ✅ Running on port **5173**
- **Connection:** ✅ Configured and working

---

## 📡 How the Frontend Connects to Backend

### Configuration

The frontend automatically connects to the backend using:

1. **Environment Variable:** `VITE_API_URL` (if set in `.env`)
2. **Default:** `http://localhost:8081` (if `VITE_API_URL` is not set)

### Where It's Used

The API base URL is configured in:
- `client/src/lib/queryClient.ts` - Main API request function
- `client/src/hooks/useAuth.tsx` - Authentication requests
- `client/src/hooks/useWebSocket.tsx` - WebSocket connections
- Various components making API calls

**Code Pattern:**
```typescript
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
const fullUrl = `${apiBaseUrl}/api/endpoint`;
```

---

## 🔧 Starting the Backend Server

### Option 1: Using npm script (Recommended)

```bash
npm run dev
```

This runs:
```bash
NODE_ENV=development tsx server/index.ts
```

### Option 2: Direct command

```bash
npx tsx server/index.ts
```

### Option 3: With environment variables

```bash
NODE_ENV=development \
SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co \
SUPABASE_ANON_KEY=your_anon_key \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
npx tsx server/index.ts
```

---

## 🌐 Server Endpoints

### Base URL
- **Local Development:** `http://localhost:8081`
- **Network Access:** `http://192.168.12.215:8081` (your local IP)

### API Routes
All API routes are prefixed with `/api`:

- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/trips` - Get trips
- `POST /api/trips` - Create trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- ... and more

### WebSocket
- **Protocol:** `ws://` (or `wss://` for HTTPS)
- **Port:** 8081
- **Path:** `/ws` (handled by WebSocket server)

---

## 🔍 Verifying Connection

### Check if Backend is Running

```bash
# Check if port 8081 is in use
lsof -ti :8081

# Or test the connection
curl http://localhost:8081/api/health
```

### Check Frontend Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for requests to `localhost:8081`
4. Check for CORS errors or connection refused errors

### Test API Endpoint

```bash
# Test authentication endpoint (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8081/api/auth/user
```

---

## ⚙️ Environment Configuration

### Frontend (.env in project root)

```env
# Optional: Override default backend URL
VITE_API_URL=http://localhost:8081

# For network access (mobile devices, other computers)
# VITE_API_URL=http://192.168.12.215:8081
```

### Backend (.env in project root)

```env
SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=8081  # Optional, defaults to 8081
```

---

## 📱 Mobile App Connection

For the mobile app (Expo), the API URL is configured in:
- `mobile/services/api.ts`

**Configuration:**
- **Web/Simulator:** `http://localhost:8081`
- **Physical Device:** `http://YOUR_MAC_IP:8081` (e.g., `http://192.168.12.215:8081`)

Set via environment variable:
```env
EXPO_PUBLIC_API_URL=http://192.168.12.215:8081
```

---

## 🔐 Authentication

The frontend automatically includes authentication tokens in API requests:

1. **Primary:** Supabase session token (`session.access_token`)
2. **Fallback:** localStorage token (`auth_token` or `authToken`)

**Headers sent:**
```typescript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🐛 Troubleshooting

### Backend Not Running

**Error:** `ERR_CONNECTION_REFUSED` or `404 Not Found`

**Solution:**
```bash
# Start the backend server
npm run dev
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin` errors

**Solution:** The backend is configured to allow CORS from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (alternative port)
- Your network IP addresses

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::8081`

**Solution:**
```bash
# Find and kill the process using port 8081
lsof -ti :8081 | xargs kill -9

# Or use a different port
PORT=8082 npm run dev
```

Then update frontend:
```env
VITE_API_URL=http://localhost:8082
```

### Authentication Errors

**Error:** `401 Unauthorized` or `Invalid API key`

**Solution:**
1. Check that Supabase environment variables are set
2. Verify user is logged in
3. Check browser console for token errors
4. Verify backend has access to Supabase keys

---

## 📊 Current Setup

### Running Services

| Service | Port | Status | URL |
|---------|------|--------|-----|
| Backend API | 8081 | ✅ Running | `http://localhost:8081` |
| Vite Dev Server | 5173 | ✅ Running | `http://localhost:5173` |
| WebSocket | 8081 | ✅ Running | `ws://localhost:8081/ws` |

### Connection Flow

```
Browser (localhost:5173)
    ↓
Vite Dev Server
    ↓
API Request → http://localhost:8081/api/*
    ↓
Express Backend Server
    ↓
Supabase / Database
```

---

## ✅ Quick Checklist

- [ ] Backend server running on port 8081
- [ ] Frontend can access `http://localhost:8081`
- [ ] Environment variables set in `.env`
- [ ] No CORS errors in browser console
- [ ] API requests return data (not 404/500)
- [ ] Authentication tokens are being sent

---

## 📝 Notes

- The backend serves both the API and can serve static files
- WebSocket connections use the same port (8081)
- For production, you'll need to configure proper CORS origins
- Mobile devices need the network IP, not `localhost`

---

**Last Updated:** 2025-01-27

