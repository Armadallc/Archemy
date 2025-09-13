# Supabase Setup for Aethr Transport Management

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization
4. Set project name: "Aethr Transport Management"
5. Set database password (save this securely)
6. Choose region closest to your users
7. Click "Create new project"

## Step 2: Import Database Schema

1. Once your project is ready, go to the SQL Editor
2. Copy the entire contents of `supabase-schema.sql` file
3. Paste and run the SQL to create all tables, indexes, and policies

## Step 3: Get Connection Details

From your Supabase dashboard, go to Settings > Database:

1. **Project URL**: Found in Settings > API (looks like `https://xyz.supabase.co`)
2. **Service Role Key**: Found in Settings > API > service_role (secret key)
3. **Database Password**: The password you set when creating the project

## Step 4: Configure Environment Variables

Create a `.env` file in your project root with these variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
SUPABASE_DB_PASSWORD=your-database-password

# Optional: Session secret for future auth
SESSION_SECRET=your-random-session-secret-key
```

## Step 5: Test Connection

After setting the environment variables:

1. Restart your application
2. Check the console logs for "Connected to Supabase PostgreSQL"
3. Verify the application loads and displays data

## Current Status

- ✅ Supabase client library installed
- ✅ Database connection configured with fallback to local
- ✅ Environment variable examples provided
- ✅ Complete SQL schema ready for import
- ✅ Application runs with existing local database

## Next Steps After Supabase Setup

1. **Test the connection** by setting environment variables
2. **Import the schema** using the provided SQL file
3. **Seed initial data** through the Supabase dashboard or API
4. **Implement Supabase Auth** for proper user management
5. **Configure Row Level Security** policies for multi-tenant access

## Benefits of Supabase

- **Managed PostgreSQL**: No database maintenance required
- **Built-in Authentication**: User registration, login, password reset
- **Real-time subscriptions**: Live updates across clients
- **Automatic backups**: Point-in-time recovery
- **Edge functions**: Server-side logic deployment
- **Dashboard**: Visual database management

The application will continue using your local database until Supabase environment variables are configured.