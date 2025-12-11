# How to Run SQL Commands for Testing

Since you're using **Supabase**, you have several options to run SQL commands:

---

## Option 1: Supabase Dashboard SQL Editor (EASIEST) ⭐

**Best for:** Quick queries and migrations

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Paste your SQL command:
   ```sql
   SELECT COUNT(*) FROM tenant_roles;
   ```
6. Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)

**This is the easiest way to test the migration!**

---

## Option 2: psql Command Line

**Best for:** Scripts and automation

### Step 1: Get Your Connection String

Your connection string is in your `.env` file or `update-env.js`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iuawurdssgbkbavyyvbs.supabase.co:5432/postgres
```

Or construct it from your Supabase dashboard:
- Go to **Settings → Database**
- Find **Connection string** → **URI**
- Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Step 2: Run psql Command

**On macOS/Linux:**
```bash
# Replace with your actual connection string
psql "postgresql://postgres:YOUR_PASSWORD@db.iuawurdssgbkbavyyvbs.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM tenant_roles;"
```

**Or connect interactively:**
```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.iuawurdssgbkbavyyvbs.supabase.co:5432/postgres"
```

Then run SQL commands:
```sql
SELECT COUNT(*) FROM tenant_roles;
\q  -- to quit
```

---

## Option 3: Supabase CLI

**Best for:** Developers who prefer CLI tools

### Install Supabase CLI:
```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### Login:
```bash
supabase login
```

### Link to your project:
```bash
supabase link --project-ref iuawurdssgbkbavyyvbs
```

### Run SQL:
```bash
supabase db execute "SELECT COUNT(*) FROM tenant_roles;"
```

---

## Option 4: Run Migration File Directly

**Best for:** Running the full migration

### Via Supabase Dashboard:
1. Go to **SQL Editor**
2. Click **"New query"**
3. Open `migrations/0050_hybrid_rbac_tenant_roles.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **"Run"**

### Via psql:
```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.iuawurdssgbkbavyyvbs.supabase.co:5432/postgres" \
  -f migrations/0050_hybrid_rbac_tenant_roles.sql
```

---

## Quick Test Commands

### 1. Check if migration ran:
```sql
SELECT COUNT(*) FROM tenant_roles;
```

### 2. Check if columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('tenant_role_id', 'active_tenant_id');
```

### 3. Check if role_type column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'role_permissions' 
AND column_name = 'role_type';
```

### 4. Check default tenant roles created:
```sql
SELECT corporate_client_id, name, COUNT(*) 
FROM tenant_roles 
GROUP BY corporate_client_id, name;
```

### 5. Check permissions seeded:
```sql
SELECT role_type, COUNT(*) 
FROM role_permissions 
GROUP BY role_type;
```

---

## Recommended Workflow

1. **Run Migration:** Use Supabase Dashboard SQL Editor (Option 1)
   - Open `migrations/0050_hybrid_rbac_tenant_roles.sql`
   - Copy and paste into SQL Editor
   - Run it

2. **Verify Results:** Use Supabase Dashboard SQL Editor
   - Run the quick test commands above
   - Check that data was created correctly

3. **Test API:** Use your terminal/Postman
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8081/api/tenant-roles?corporate_client_id=monarch
   ```

4. **Test Frontend:** Open browser
   - Navigate to: `http://localhost:5173/corporate-client/monarch/settings?tab=tenant-roles`

---

## Troubleshooting

**"relation does not exist" error:**
- Migration hasn't run yet
- Run the migration first

**"permission denied" error:**
- Make sure you're using the correct database password
- Check that your connection string is correct

**Connection timeout:**
- Check your internet connection
- Verify Supabase project is active
- Check firewall settings

---

## Security Note

⚠️ **Never commit your `.env` file or connection strings to git!**

Your `update-env.js` file contains sensitive credentials - make sure it's in `.gitignore`.

