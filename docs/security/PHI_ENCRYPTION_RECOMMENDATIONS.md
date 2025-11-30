# PHI Encryption Recommendations

**Date:** 2025-01-27  
**Status:** Recommendations for Beta Launch

---

## Overview

Based on the database schema review, here are recommendations for application-level encryption of PHI (Protected Health Information) fields.

**Note:** Supabase provides encryption at rest for the entire database. Application-level encryption adds an additional layer of security for the most sensitive PHI fields.

---

## HIGH PRIORITY - Encrypt These Fields

These fields contain the most sensitive PHI and should be encrypted at the application level:

### 1. `clients.medical_conditions` (TEXT)
- **Reason:** Contains detailed medical information
- **Encryption:** AES-256-GCM recommended
- **Implementation:** Encrypt before storing, decrypt only when displaying to authorized users

### 2. `clients.special_requirements` (TEXT)
- **Reason:** May contain medical accommodations, disabilities, or health-related needs
- **Encryption:** AES-256-GCM recommended
- **Implementation:** Encrypt before storing, decrypt only when displaying to authorized users

### 3. `clients.date_of_birth` (DATE)
- **Reason:** Health identifier (can be used with other info to identify individuals)
- **Encryption:** AES-256-GCM recommended
- **Implementation:** Encrypt before storing, decrypt for age calculations and authorized displays

### 4. `clients.billing_pin` (VARCHAR)
- **Reason:** Sensitive identifier used for billing verification
- **Encryption:** AES-256-GCM recommended
- **Implementation:** Encrypt before storing, decrypt only for verification purposes

---

## MEDIUM PRIORITY - Consider Encrypting

These fields contain PHI but may be needed more frequently for operations:

### 5. `clients.first_name` and `clients.last_name` (VARCHAR)
- **Reason:** Identifiers that can be used to identify individuals
- **Consideration:** Needed for display and search - may impact performance
- **Recommendation:** Encrypt if search functionality can be adapted (e.g., searchable encryption)

### 6. `clients.phone` and `clients.emergency_contact_phone` (VARCHAR)
- **Reason:** Contact information that can identify individuals
- **Consideration:** Needed for notifications and communication
- **Recommendation:** Encrypt if notification system can be adapted

### 7. `clients.address` (TEXT)
- **Reason:** Location information that can identify individuals
- **Consideration:** Needed for trip planning and navigation
- **Recommendation:** Encrypt if geocoding can be done with encrypted data

### 8. `trips.pickup_address` and `trips.dropoff_address` (TEXT)
- **Reason:** Location information that can identify individuals
- **Consideration:** Needed for trip execution and driver navigation
- **Recommendation:** Encrypt if navigation can be adapted

---

## LOW PRIORITY - May Not Need Encryption

These fields are less sensitive or needed too frequently:

### 9. `clients.email` (VARCHAR)
- **Reason:** Less sensitive, often needed for communication
- **Recommendation:** Rely on Supabase encryption at rest

### 10. Demographic Fields (`race`, `birth_sex`, `age`)
- **Reason:** Less critical, often needed for reporting
- **Recommendation:** Rely on Supabase encryption at rest

---

## Implementation Approach

### Option 1: Field-Level Encryption (Recommended for MVP)
- Encrypt only HIGH PRIORITY fields
- Use a library like `crypto` (Node.js built-in) or `node-forge`
- Store encryption keys in environment variables (never in code)
- Decrypt on-demand when displaying to authorized users

### Option 2: Database-Level Encryption
- Use PostgreSQL's `pgcrypto` extension
- Encrypt at the database level
- More transparent to application code
- Requires database-level key management

### Option 3: Hybrid Approach
- Use Supabase encryption at rest (already provided)
- Add application-level encryption for HIGH PRIORITY fields only
- Provides defense in depth

---

## Encryption Key Management

### Requirements:
1. **Key Storage:** Environment variables (Render.com secrets)
2. **Key Rotation:** Quarterly rotation policy
3. **Key Backup:** Secure backup of encryption keys
4. **Key Access:** Limited to application server only

### Implementation:
```typescript
// Example: Store encryption key in environment variable
const ENCRYPTION_KEY = process.env.PHI_ENCRYPTION_KEY;

// Example: Encrypt before storing
function encryptPHI(data: string): string {
  // Use AES-256-GCM encryption
  // Return encrypted string
}

// Example: Decrypt when displaying
function decryptPHI(encryptedData: string): string {
  // Use AES-256-GCM decryption
  // Return decrypted string
}
```

---

## Performance Considerations

- **Encryption/Decryption Overhead:** Minimal for text fields
- **Search Functionality:** Encrypted fields cannot be searched directly
  - Solution: Store searchable hash or use searchable encryption
- **Indexing:** Encrypted fields cannot be indexed efficiently
  - Solution: Index on encrypted hash if needed

---

## Recommended Implementation Timeline

### Phase 1 (Before Beta Launch):
- ✅ Verify Supabase encryption at rest
- ⏳ Document PHI fields inventory
- ⏳ Plan encryption strategy

### Phase 2 (Within 1 Month):
- ⏳ Implement encryption for HIGH PRIORITY fields
- ⏳ Test encryption/decryption performance
- ⏳ Update API endpoints to handle encrypted data

### Phase 3 (Within 3 Months):
- ⏳ Consider encryption for MEDIUM PRIORITY fields
- ⏳ Implement key rotation policy
- ⏳ Monitor encryption performance

---

## Questions to Answer Before Implementation

1. **Search Requirements:** Do you need to search encrypted fields?
   - If yes, consider searchable encryption or hash-based search

2. **Performance Impact:** What's acceptable latency for encryption/decryption?
   - Test with realistic data volumes

3. **Key Management:** Who will manage encryption keys?
   - Define key management procedures

4. **Backup Strategy:** How will encrypted data be backed up?
   - Ensure keys are backed up separately

---

## References

- [Supabase Encryption Documentation](https://supabase.com/docs/guides/platform/security)
- [HIPAA Encryption Requirements](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)

---

**Last Updated:** 2025-01-27  
**Next Review:** Before Phase 2 Implementation

