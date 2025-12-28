# Duplicate Client Management Feature

## Summary

This document outlines the implementation of a comprehensive duplicate client management system that allows users to:
1. Detect duplicate clients based on matching first and last names
2. View grouped duplicates in an interactive dialog
3. Select individual clients or select all
4. Merge clients (unidirectional to client with valid SCID)
5. Delete selected duplicate clients

## Implementation Plan

### Frontend (Client-Side)

1. **Duplicate Detection**
   - Client-side detection based on `first_name` and `last_name` matching
   - Groups clients with identical names (case-insensitive, trimmed)
   - Only shows groups with 2+ clients

2. **Dialog Component**
   - Shows all duplicate groups
   - Each group displays:
     - Client name (first + last)
     - SCID (if available)
     - Program
     - Created date
     - Checkbox for selection
   - Highlights the "primary" client (one with valid SCID) for merge operations
   - Select All / Deselect All functionality

3. **Actions**
   - **Merge**: Unidirectional merge to the client with valid SCID
     - Only enabled when a primary client (with SCID) is selected
     - Merges data from selected clients into the primary client
     - Transfers related records (trips, group memberships, etc.)
   - **Delete**: Deletes selected clients
     - Shows confirmation dialog
     - Cannot delete if client has active trips

### Backend (Server-Side)

1. **API Endpoints Needed**
   - `POST /api/clients/merge` - Merge multiple clients into one
   - `POST /api/clients/bulk-delete` - Delete multiple clients
   - `GET /api/clients/:id/related-data` - Get related records count

2. **Merge Logic**
   - Identify primary client (has SCID)
   - Transfer all data from secondary clients to primary:
     - Update trip records to point to primary client
     - Update client group memberships
     - Merge medical notes, special requirements, etc.
     - Keep most recent data where conflicts exist
   - Delete secondary clients after successful merge

3. **Validation**
   - Cannot merge if primary client doesn't have SCID
   - Cannot delete clients with active trips (or warn user)
   - Check for data conflicts before merge

## Current System Capabilities

### ✅ What's Possible
- Client-side duplicate detection (already implemented)
- Display duplicates in dialog
- Selection mechanism
- Basic delete functionality exists

### ⚠️ What Needs Implementation
- Merge API endpoint
- Bulk delete API endpoint
- Transfer of related records (trips, group memberships)
- Validation for active trips
- UI for merge operation

## Recommendations

1. **Start with Delete Only**: Implement the delete functionality first as it's simpler
2. **Add Merge Later**: Merge requires more complex backend logic for data transfer
3. **Add Warnings**: Show warnings for clients with active trips or group memberships
4. **Audit Trail**: Log all merge/delete operations for compliance

## Next Steps

1. Implement duplicate detection function (client-side) ✅
2. Create DuplicateManagementDialog component
3. Add merge mutation and API endpoint
4. Add bulk delete mutation
5. Add validation and warnings
6. Test with real data

