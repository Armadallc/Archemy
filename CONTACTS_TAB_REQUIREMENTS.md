# Contacts Tab Requirements Summary & Execution Plan

## Summary of Understanding

### Current State
- The Contacts Tab currently displays users from the `users` table
- Contacts are scoped by hierarchy level (corporate client, program)
- Only shows app users, not external contacts
- No personalization or custom contacts per user
- No categories or filtering beyond basic role-based scoping

### Required Changes

#### 1. **Dual Contact System**
   - **Auto-populated contacts**: Users within the tenant/program automatically appear as contacts
   - **User-created contacts**: Users can add their own personal contacts (like a phone book)
   - Each user has their own unique set of contacts (personalized)

#### 2. **Contact Data Model**
   - Contacts can be:
     - **App users**: Linked to `users` table via `user_id` (auto-populated)
     - **External contacts**: Not app users, manually entered (organization, phone, email, etc.)
   - All contacts have: first name, last name, phone, email, role, category
   - External contacts also have: organization name
   - Contacts are scoped to the user who created them (`owner_user_id`)

#### 3. **Contact Categories** (Predefined - 8 categories)
   - Recovery
   - Comp/Rest
   - Liaison
   - Case Management
   - Referrals
   - Clinical
   - CMA
   - Other (allows user to write custom text, but filters as "Other" category)

#### 4. **Display Requirements**
   - Table format with columns:
     - Avatar (for app users)
     - First Name
     - Last Name
     - Tenant/Corporate Client
     - Program
     - Role
     - Phone
     - Email
     - Active Status

#### 5. **Functionality Requirements**
   - Add new contacts (both app users and external)
   - Filter by: role, alphabetical, program, location, category
   - Edit existing contacts
   - Delete contacts
   - Auto-populate tenant users as contacts
   - Personalization per user

#### 6. **Access Control**
   - Non-super admin users: contacts scoped within their tenant
   - Super admin: can see all contacts (or scoped by selection)
   - Each user's personal contacts are private to them

---

## Execution Plan

### Phase 1: Database Schema Changes

#### Step 1.1: Create Contact Categories Enum/Table
**File**: `server/migrations/012_create_contact_categories.sql`

```sql
-- Create contact_categories table
CREATE TABLE IF NOT EXISTS contact_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    allows_custom_text BOOLEAN DEFAULT false, -- For "Other" category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined categories
INSERT INTO contact_categories (id, name, allows_custom_text) VALUES
    ('recovery', 'Recovery', false),
    ('comp_rest', 'Comp/Rest', false),
    ('liaison', 'Liaison', false),
    ('case_management', 'Case Management', false),
    ('referrals', 'Referrals', false),
    ('clinical', 'Clinical', false),
    ('cma', 'CMA', false),
    ('other', 'Other', true) -- Allows custom text input
ON CONFLICT (id) DO NOTHING;
```

#### Step 1.2: Create Contacts Table
**File**: `server/migrations/013_create_contacts_table.sql`

```sql
-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    owner_user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Link to app user (if this contact is an app user)
    user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Contact information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    organization VARCHAR(255), -- For external contacts
    role VARCHAR(100), -- Role description (may differ from app user role)
    
    -- Category
    category_id VARCHAR(50) REFERENCES contact_categories(id),
    category_custom_text VARCHAR(255), -- Custom text for "Other" category
    
    -- Program/Location context (for filtering)
    program_id VARCHAR(50) REFERENCES programs(id) ON DELETE SET NULL,
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE SET NULL,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_app_user BOOLEAN DEFAULT false, -- True if linked to users table
    notes TEXT, -- Personal notes about the contact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_user_id ON contacts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_category_id ON contacts(category_id);
CREATE INDEX IF NOT EXISTS idx_contacts_program_id ON contacts(program_id);
CREATE INDEX IF NOT EXISTS idx_contacts_location_id ON contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active);

-- Unique constraint: prevent duplicate app user contacts for same owner
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_owner_app_user 
    ON contacts(owner_user_id, user_id) 
    WHERE user_id IS NOT NULL;
```

#### Step 1.3: Auto-populate Function
**File**: `server/migrations/014_auto_populate_contacts.sql`

```sql
-- Function to auto-populate contacts from tenant users
CREATE OR REPLACE FUNCTION auto_populate_tenant_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new user is created, add them as contacts to all users in their tenant
    -- This will be called via trigger or manual sync
    INSERT INTO contacts (
        owner_user_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        is_app_user,
        program_id,
        location_id,
        is_active
    )
    SELECT 
        u.user_id as owner_user_id,
        NEW.user_id as user_id,
        COALESCE(NEW.first_name, '') as first_name,
        COALESCE(NEW.last_name, '') as last_name,
        NEW.email,
        NEW.phone,
        NEW.role,
        true as is_app_user,
        NEW.primary_program_id as program_id,
        NULL as location_id, -- Can be enhanced later
        NEW.is_active
    FROM users u
    WHERE u.corporate_client_id = NEW.corporate_client_id
      AND u.user_id != NEW.user_id
      AND u.is_active = true
    ON CONFLICT (owner_user_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate on user creation (optional - may want manual sync instead)
-- CREATE TRIGGER trigger_auto_populate_contacts
--     AFTER INSERT ON users
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_populate_tenant_contacts();
```

---

### Phase 2: Backend API Updates

#### Step 2.1: Create Contacts Storage Layer
**File**: `server/contacts-storage.ts` (new file)

```typescript
// Similar structure to minimal-supabase.ts
// Functions:
// - getAllContacts(userId, filters)
// - getContact(id)
// - createContact(contactData)
// - updateContact(id, updates)
// - deleteContact(id)
// - syncTenantUsersToContacts(userId) - auto-populate
```

#### Step 2.2: Update Contacts Routes
**File**: `server/routes/contacts.ts`

**New Endpoints:**
- `GET /api/contacts` - Get all contacts for current user (with filters)
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create new contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `POST /api/contacts/sync-tenant` - Manually sync tenant users to contacts
- `GET /api/contacts/categories` - Get all contact categories

**Filtering Support:**
- Query params: `category`, `role`, `program_id`, `location_id`, `search`, `alphabetical`

#### Step 2.3: Update Contact Response Format
- Merge app user data when `user_id` is present
- Include avatar_url from users table
- Include corporate_client and program names via joins

---

### Phase 3: Frontend Updates

#### Step 3.1: Update Contacts Tab UI
**File**: `client/src/pages/settings.tsx`

**Changes:**
1. Replace current simple list with table view
2. Add columns: Avatar, First Name, Last Name, Tenant, Program, Role, Phone, Email, Active Status
3. Add "Add Contact" button
4. Add filtering UI (dropdowns for category, role, program, location, alphabetical sort)
5. Add search bar
6. Make rows editable (inline editing or modal)

#### Step 3.2: Create Contact Form Component
**File**: `client/src/components/settings/ContactForm.tsx` (new)

**Fields:**
- First Name *
- Last Name *
- Email
- Phone
- Organization (for external contacts)
- Role
- Category (dropdown with predefined categories)
  - If "Other" selected: show text input for custom category description
- Program (optional, for filtering)
- Location (optional, for filtering)
- Notes (optional)
- Is App User (checkbox - if checked, show user selector)

#### Step 3.3: Update Contact Interface
**File**: `client/src/pages/settings.tsx`

```typescript
interface Contact {
  id: string;
  owner_user_id: string;
  user_id?: string; // If app user
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  role?: string;
  category_id?: string;
  category_name?: string;
  category_custom_text?: string; // For "Other" category
  program_id?: string;
  program_name?: string;
  location_id?: string;
  location_name?: string;
  is_active: boolean;
  is_app_user: boolean;
  avatar_url?: string; // From users table if app user
  notes?: string;
  // Enriched fields
  corporate_client_name?: string;
}
```

#### Step 3.4: Add Filtering & Sorting
- Category filter dropdown
- Role filter dropdown
- Program filter dropdown
- Location filter dropdown
- Alphabetical sort toggle (A-Z, Z-A)
- Search bar (filters by name, email, phone, organization)

---

### Phase 4: Auto-Population Logic

#### Step 4.1: Sync Function
**File**: `server/contacts-storage.ts`

```typescript
async syncTenantUsersToContacts(ownerUserId: string) {
  // Get owner user's tenant
  // Get all users in that tenant
  // Create contact records for each (if not already exists)
  // Update existing contacts if user info changed
}
```

#### Step 4.2: Initial Sync
- Run migration script to populate contacts for existing users
- Or provide "Sync Contacts" button in UI

---

### Phase 5: Testing & Validation

#### Step 5.1: Test Cases
1. ✅ Create external contact
2. ✅ Create contact from app user
3. ✅ Auto-populate tenant users
4. ✅ Filter by category
5. ✅ Filter by role
6. ✅ Filter by program
7. ✅ Search functionality
8. ✅ Edit contact
9. ✅ Delete contact
10. ✅ Personalization (user A's contacts don't show for user B)
11. ✅ Tenant scoping (non-super admin only sees their tenant)

---

## Implementation Order

1. **Database Schema** (Phase 1)
   - Create contact_categories table
   - Create contacts table
   - Run migrations

2. **Backend Storage Layer** (Phase 2.1)
   - Create contacts-storage.ts
   - Implement CRUD operations

3. **Backend API** (Phase 2.2)
   - Update contacts routes
   - Add filtering logic

4. **Frontend UI** (Phase 3)
   - Update contacts tab display
   - Add contact form
   - Add filtering UI

5. **Auto-Population** (Phase 4)
   - Implement sync function
   - Add sync button or automatic sync

6. **Testing** (Phase 5)
   - Test all functionality
   - Fix bugs

---

## Migration Files to Create

1. `server/migrations/012_create_contact_categories.sql`
2. `server/migrations/013_create_contacts_table.sql`
3. `server/migrations/014_auto_populate_contacts.sql` (optional - may use manual sync)
4. `server/migrations/015_backfill_existing_contacts.sql` (optional - initial sync for existing users)

---

## Notes

- **Personalization**: Each user's contacts are private. The `owner_user_id` field ensures contacts are scoped per user.
- **Auto-population**: Can be done via trigger (automatic) or manual sync button (recommended for control).
- **External vs App Users**: Use `is_app_user` flag and `user_id` foreign key to distinguish.
- **Categories**: Predefined list, no user-created categories for now.
- **Filtering**: All filters should work together (AND logic).

