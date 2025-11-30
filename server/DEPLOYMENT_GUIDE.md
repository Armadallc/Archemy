# HALCYON NMT Database Schema Deployment Guide

## 🚀 Manual Deployment Instructions

Since Supabase doesn't allow direct SQL execution through the client, you'll need to deploy the schema manually through the Supabase dashboard.

### **Step 1: Access Supabase Dashboard**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `iuawurdssgbkbavyyvbs`

### **Step 2: Open SQL Editor**

1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"**

### **Step 3: Deploy the Schema**

1. Copy the entire contents of `server/create-complete-schema.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the schema

### **Step 4: Verify Deployment**

1. Check the **"Tables"** section in the left sidebar
2. You should see all the new tables:
   - `corporate_clients`
   - `programs`
   - `locations`
   - `users`
   - `clients`
   - `client_groups`
   - `client_group_memberships`
   - `drivers`
   - `vehicles`
   - `vehicle_assignments`
   - `vehicle_maintenance`
   - `trip_categories`
   - `trips`
   - `driver_schedules`
   - `driver_duty_status`
   - `driver_locations`
   - `notification_templates`
   - `notifications`
   - `notification_deliveries`
   - `notification_preferences`
   - `trip_status_logs`
   - `offline_updates`

### **Step 5: Check Views**

1. In the **"Tables"** section, look for:
   - `program_hierarchy` (view)
   - `trip_statistics` (view)

### **Step 6: Verify Data**

1. Check that initial data was inserted:
   - Corporate clients: `monarch`, `halcyon`
   - Programs: `monarch_competency`, `monarch_mental_health`, etc.
   - Trip categories for each program
   - Notification templates

## 🔧 Alternative: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref iuawurdssgbkbavyyvbs

# Deploy the schema
supabase db push --file server/create-complete-schema.sql
```

## 📊 Schema Overview

The deployed schema includes:

### **Core Tables:**
- **Corporate Clients** → **Programs** → **Locations** → **Clients**
- **Users** with 5-tier role hierarchy
- **Drivers** and **Vehicles** management
- **Trips** with enhanced features

### **New Features:**
- **Trip Categories** (8 categories per program)
- **Client Groups** for group trips
- **Recurring Trips** support
- **Driver Schedules** and duty status
- **Vehicle Maintenance** tracking
- **Notification System** (push, SMS, email)
- **GPS Tracking** for drivers
- **Offline Sync** for mobile app

### **Security:**
- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control**
- **Data segregation** by program/corporate client

## ✅ Verification Checklist

- [ ] All tables created successfully
- [ ] Views created successfully
- [ ] Indexes created successfully
- [ ] Triggers created successfully
- [ ] Initial data inserted
- [ ] RLS policies enabled
- [ ] Functions created successfully

## 🚨 Troubleshooting

### **Common Issues:**

1. **Permission Denied**: Make sure you're using the service role key
2. **Table Already Exists**: Drop existing tables first if needed
3. **Foreign Key Errors**: Check that referenced tables exist first
4. **Timeout**: Execute in smaller chunks if the schema is too large

### **If Deployment Fails:**

1. Check the Supabase logs for specific errors
2. Try executing the schema in smaller chunks
3. Verify all dependencies are met
4. Check for naming conflicts

## 🎉 Next Steps

After successful deployment:

1. **Test the API endpoints** to ensure they work with the new schema
2. **Create test users** with different roles
3. **Add sample data** for testing
4. **Verify all features** are working correctly

## 📞 Support

If you encounter issues:

1. Check the Supabase documentation
2. Review the error messages in the SQL Editor
3. Verify your environment variables are correct
4. Ensure you have the necessary permissions

---

**Schema Version**: 2.0.0  
**Created**: 2024-01-01  
**Last Updated**: 2024-01-01


