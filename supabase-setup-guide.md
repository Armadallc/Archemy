# Aethr Transport Management - Supabase Setup Guide

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: "Aethr Transport Management"
3. Note your project URL and anon key

## 2. Import Database Schema
1. In Supabase dashboard, go to SQL Editor
2. Copy and paste the entire `supabase-schema.sql` file
3. Run the SQL to create all tables, indexes, and policies

## 3. Configure Authentication
1. Go to Authentication > Settings
2. Enable Email/Password authentication
3. Disable email confirmations for development (Settings > Auth > Email Auth)
4. Set up custom JWT claims for role-based access

## 4. Environment Variables
Update your `.env` file with:
```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## 5. Update Application Code
After database setup, you'll need to:
1. Install Supabase client: `npm install @supabase/supabase-js`
2. Replace current auth system with Supabase Auth
3. Update database client to use Supabase
4. Implement user registration flow
5. Set up proper password hashing via Supabase

## 6. Row Level Security Notes
The schema includes RLS policies that filter data by organization. These will need to be adjusted based on your specific Supabase auth JWT structure.

## Current Status
- ✅ Database schema exported to `supabase-schema.sql`
- ✅ Authentication temporarily disabled 
- ✅ Application running without auth barriers
- ⏳ Ready for Supabase migration
- ⏳ User registration system pending
- ⏳ Proper authentication implementation pending

## Next Steps
1. Set up Supabase project and import schema
2. Install Supabase client library
3. Implement proper authentication with user registration
4. Re-enable security with proper user management