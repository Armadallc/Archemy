import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Get configuration
const supabaseUrl = process.env.SUPABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

console.log("🔧 Supabase URL configured:", !!supabaseUrl);
console.log("🔧 Database URL configured:", !!databaseUrl);

// Create Supabase client for auth (optional)
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy')
  : null;

// Try direct connection first, fall back to alternative if needed
let connectionUrl = databaseUrl;
if (databaseUrl && databaseUrl.includes('db.uocnesirsir') && !databaseUrl.includes('.supabase.co')) {
  connectionUrl = databaseUrl.replace('db.uocnesirsir', 'db.uocnesirsirwakbkzcei.supabase.co');
  console.log("🔧 Fixed Supabase database URL");
}

if (!connectionUrl) {
  throw new Error("DATABASE_URL is required");
}

// Try alternative connection configurations for Supabase
const connectionOptions = {
  ssl: false, // Disable SSL to fix SASL authentication errors
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
};

console.log("🔧 Attempting database connection...");
export const sql = postgres(connectionUrl, connectionOptions);

export const db = drizzle(sql, { schema });