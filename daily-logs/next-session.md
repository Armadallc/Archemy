# Next Session - Client Groups Implementation

## 🎯 **PRIORITY: Complete Client Groups Functionality**

### **📋 Current Status:**
- ✅ **Backend Complete**: API endpoints, database schema, storage functions all working
- ✅ **Frontend UI Complete**: Client groups section exists in `/clients` page with full UI
- ❌ **Missing**: Client group mutations and form submissions

### **🔍 Problem Identified:**
User tried to create a client group but it didn't work after clicking save. The UI exists but the mutations are missing.

### **📊 Analysis Completed:**
1. **Legacy System Reference**: Found in `legacy-reference/halcyon_database_dump.sql`
   - Client groups had: `id`, `organization_id`, `name`, `description`, `service_area_id`, `is_active`, `created_at`, `updated_at`, `expires_at`
   - Sample groups: "test group", "Test Group A", "Phoenix Group"
   - Groups were scoped to organizations (now programs)

2. **Current System Status**:
   - Database schema: ✅ Complete (`client_groups`, `client_group_memberships`)
   - API endpoints: ✅ Complete (CRUD operations in `server/api-routes.ts`)
   - Storage functions: ✅ Complete (`clientGroupsStorage` in `server/minimal-supabase.ts`)
   - Frontend UI: ✅ Complete (in `client/src/pages/clients.tsx`)
   - **Missing**: useMutation hooks for client group operations

### **🚀 Implementation Plan:**

#### **Phase 1: Add Missing Mutations** (Priority 1)
Add these mutations to `client/src/pages/clients.tsx`:

```typescript
// Create client group mutation
const createGroupMutation = useMutation({
  mutationFn: async (groupData: { name: string; description: string; selectedClients: string[] }) => {
    const response = await apiRequest("POST", "/api/client-groups", {
      name: groupData.name,
      description: groupData.description,
      program_id: selectedProgram,
      is_active: true
    });
    const group = await response.json();
    
    // Add members to group
    if (groupData.selectedClients.length > 0) {
      await Promise.all(groupData.selectedClients.map(clientId => 
        apiRequest("POST", "/api/client-group-memberships", {
          client_id: clientId,
          client_group_id: group.id
        })
      ));
    }
    
    return group;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/client-groups"] });
    setIsCreateGroupDialogOpen(false);
    setGroupFormData({ name: "", description: "", selectedClients: [] });
    toast({ title: "Group Created", description: "Client group created successfully" });
  }
});

// Update client group mutation
const updateGroupMutation = useMutation({
  mutationFn: async (data: { id: string; updates: any }) => {
    return apiRequest("PATCH", `/api/client-groups/${data.id}`, data.updates);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/client-groups"] });
    setIsEditGroupDialogOpen(false);
    toast({ title: "Group Updated", description: "Client group updated successfully" });
  }
});

// Delete client group mutation
const deleteGroupMutation = useMutation({
  mutationFn: async (groupId: string) => {
    return apiRequest("DELETE", `/api/client-groups/${groupId}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/client-groups"] });
    toast({ title: "Group Deleted", description: "Client group deleted successfully" });
  }
});
```

#### **Phase 2: Connect Form Submissions** (Priority 2)
Update the form submission handlers:

```typescript
// In Create Group Dialog
const handleCreateGroup = (e: React.FormEvent) => {
  e.preventDefault();
  if (groupFormData.name.trim()) {
    createGroupMutation.mutate(groupFormData);
  }
};

// In Edit Group Dialog  
const handleUpdateGroup = (e: React.FormEvent) => {
  e.preventDefault();
  if (editingGroup) {
    updateGroupMutation.mutate({
      id: editingGroup.id,
      updates: groupFormData
    });
  }
};

// In Delete Group Dialog
const handleDeleteGroup = (groupId: string) => {
  deleteGroupMutation.mutate(groupId);
};
```

#### **Phase 3: Add Member Management** (Priority 3)
Add mutations for managing group members:

```typescript
// Add member to group
const addMemberMutation = useMutation({
  mutationFn: async ({ groupId, clientId }: { groupId: string; clientId: string }) => {
    return apiRequest("POST", "/api/client-group-memberships", {
      client_id: clientId,
      client_group_id: groupId
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/client-groups"] });
  }
});

// Remove member from group
const removeMemberMutation = useMutation({
  mutationFn: async (membershipId: string) => {
    return apiRequest("DELETE", `/api/client-group-memberships/${membershipId}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/client-groups"] });
  }
});
```

### **🔧 Files to Modify:**
- `client/src/pages/clients.tsx` - Add mutations and connect forms

### **🧪 Testing Plan:**
1. **Create a test group** with sample clients
2. **Verify group appears** in the UI with correct member count
3. **Test member management** (add/remove clients from group)
4. **Test group editing** (name, description)
5. **Test group deletion**
6. **Verify data persistence** in database

### **📝 Notes:**
- Client groups are scoped to programs (not corporate clients)
- Groups can have multiple members
- Groups are used for group trips and recurring trips
- UI already exists, just need to connect the backend

### **🎯 Success Criteria:**
- User can create a client group from `/clients` page
- User can add/remove clients from groups
- User can edit group details
- User can delete groups
- All operations persist to database
- UI updates reflect changes immediately

---

**Session End Time**: 10:41 PM  
**Next Priority**: Implement client group mutations  
**Estimated Time**: 30-45 minutes
