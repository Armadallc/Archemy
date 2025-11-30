#!/usr/bin/env tsx
/**
 * Route Registration Checker
 * 
 * Verifies that all route files in server/routes/ are properly registered
 * in server/routes/index.ts. This prevents 404 errors from missing routes.
 * 
 * Usage:
 *   tsx scripts/check-routes.ts
 * 
 * Exit codes:
 *   0 - All routes are registered
 *   1 - Missing route registrations found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const routesDir = path.join(projectRoot, 'server', 'routes');
const indexFile = path.join(routesDir, 'index.ts');

// Files that are NOT route files (utilities, middleware, etc.)
const nonRouteFiles = [
  'index.ts',
  'middleware.ts',
  'legacy.ts',
  'index 2.ts', // Duplicate/backup file
];

// Get all route files (excluding index.ts, test files, and non-route files)
const routeFiles = fs.readdirSync(routesDir)
  .filter(file => {
    if (!file.endsWith('.ts')) return false;
    if (file.endsWith('.test.ts')) return false;
    if (nonRouteFiles.includes(file)) return false;
    
    // Check if file exports a router (actual route file)
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    // Route files typically export a router or default export
    return content.includes('Router') || content.includes('export default');
  })
  .map(file => file.replace('.ts', ''));

if (routeFiles.length === 0) {
  console.log('⚠️  No route files found in server/routes/');
  process.exit(0);
}

// Read the index file
const indexContent = fs.readFileSync(indexFile, 'utf-8');

// Check each route file
const missingImports: string[] = [];
const missingRegistrations: string[] = [];

routeFiles.forEach(routeName => {
  // Check for import statement
  const importPattern = new RegExp(`import\\s+\\w+Routes\\s+from\\s+["']\\./${routeName}["']`, 'i');
  if (!importPattern.test(indexContent)) {
    missingImports.push(routeName);
  }

  // Check for router.use registration
  // Route name might be different from file name (e.g., 'activity-log' vs 'activityLog')
  // So we check for both the exact route name and common variations
  const routePath = routeName.replace(/([A-Z])/g, '-$1').toLowerCase();
  const registrationPattern = new RegExp(`router\\.use\\(["']/.*${routeName}|router\\.use\\(["']/.*${routePath}`, 'i');
  
  if (!registrationPattern.test(indexContent)) {
    missingRegistrations.push(routeName);
  }
});

// Report results
if (missingImports.length === 0 && missingRegistrations.length === 0) {
  console.log('✅ All routes are properly registered!');
  console.log(`   Found ${routeFiles.length} route file(s): ${routeFiles.join(', ')}`);
  process.exit(0);
} else {
  console.error('❌ Missing route registrations found!\n');
  
  if (missingImports.length > 0) {
    console.error('Missing imports:');
    missingImports.forEach(route => {
      console.error(`   - ${route}.ts`);
      console.error(`     Add: import ${route}Routes from "./${route}";`);
    });
    console.error('');
  }
  
  if (missingRegistrations.length > 0) {
    console.error('Missing router.use() registrations:');
    missingRegistrations.forEach(route => {
      const routePath = route.replace(/([A-Z])/g, '-$1').toLowerCase();
      console.error(`   - ${route}.ts`);
      console.error(`     Add: router.use("/${routePath}", ${route}Routes);`);
    });
    console.error('');
  }
  
  console.error('💡 Fix: Add the missing imports and registrations to server/routes/index.ts');
  process.exit(1);
}

