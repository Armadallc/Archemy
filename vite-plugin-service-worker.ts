import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin to serve service worker with correct MIME type
 * Prevents SPA routing from intercepting /sw.js requests
 */
export function serviceWorkerPlugin(): Plugin {
  return {
    name: 'service-worker-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Intercept service worker requests
        if (req.url === '/sw.js' || req.url?.endsWith('/sw.js')) {
          // Try multiple possible paths
          const possiblePaths = [
            path.resolve(process.cwd(), 'client', 'public', 'sw.js'),
            path.resolve(process.cwd(), 'public', 'sw.js'),
            path.resolve(server.config.root || process.cwd(), 'public', 'sw.js'),
          ];
          
          let swPath: string | null = null;
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              swPath = possiblePath;
              break;
            }
          }
          
          if (swPath) {
            // Set correct MIME type
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Service-Worker-Allowed', '/');
            
            // Read and serve the file
            const swContent = fs.readFileSync(swPath, 'utf-8');
            res.end(swContent);
            return;
          }
        }
        
        // Continue with normal request handling
        next();
      });
    },
  };
}

