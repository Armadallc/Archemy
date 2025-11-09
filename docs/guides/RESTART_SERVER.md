# How to Restart the Server

## To restart the backend server:

1. **Go to the project root** (not the mobile directory):
   ```bash
   cd "/Users/sefebrun/Desktop/HALCYON/VSC HALCYON/HALCYON"
   ```

2. **Stop any running server processes** (if needed):
   ```bash
   # Find and kill server processes
   pkill -f "server/index.ts"
   ```

3. **Start the server**:
   ```bash
   npm run dev:server
   ```

## Note:
- `npm run dev` - Runs Vite (frontend dev server)
- `npm run dev:server` - Runs the Express backend server (what you need)

The server should now serve API routes correctly instead of HTML.

