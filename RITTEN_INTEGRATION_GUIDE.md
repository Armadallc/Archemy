# Ritten.io Integration Guide
## Comprehensive Transport Management System Overview

### Executive Summary
This document outlines the integration between Ritten.io EHR/EMR software and our multi-tenant transport management system. The integration enables automatic trip creation from calendar appointments while maintaining HIPAA compliance and providing bilateral synchronization capabilities.

### System Architecture

**Multi-Tenant Organization Structure:**
```
Monarch (Parent Company)
├── Monarch Competency
├── Monarch Mental Health  
├── Monarch Sober Living
└── Monarch Launch
```

Each organization operates independently with isolated data and separate transport fleets.

### Core Data Models

**Organizations:**
- `organization_id` (primary key)
- `name`, `logo_url`, `settings`
- Each organization has separate clients, drivers, vehicles, and trips

**Users & Roles:**
- `super_admin`: Cross-organizational access
- `organization_admin`: Full access within assigned organization
- `organization_user`: Limited booking access
- `driver`: Mobile app access for trip management

**Clients:**
- `client_id`, `organization_id`, `first_name`, `last_name`
- `email`, `phone`, `service_area_id`, `pickup_address`
- Each client belongs to one organization

**Trips (Core Entity):**
```sql
{
  id: string,
  organization_id: string,
  client_id: string,
  driver_id?: string,
  vehicle_id?: string,
  pickup_address: string,
  destination_address: string,
  scheduled_pickup_time: datetime,
  actual_pickup_time?: datetime,
  trip_type: 'one_way' | 'round_trip',
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
  notes?: string,
  created_at: datetime,
  updated_at: datetime
}
```

### Trip Creation Workflow

**Current Manual Process:**
1. Admin receives transport request via phone/email
2. Admin creates trip in system:
   - Select organization
   - Choose client from dropdown
   - Set pickup address and destination
   - Schedule pickup time
   - Assign driver (optional)
3. Trip appears in driver's mobile app
4. Driver receives notification
5. Driver updates trip status throughout journey

**Proposed Ritten Integration:**
1. Treatment center schedules appointment in Ritten
2. Staff adds transport details in appointment description
3. Ritten webhook triggers our system
4. System automatically creates trip with:
   - Client matched by name from appointment participants
   - Pickup time calculated from appointment time
   - Destination set to appointment location
   - Trip type determined by integration rules

### Integration Requirements

**Data Mapping:**
- Ritten Appointment → Transport Trip
- Appointment participants → Client matching
- Appointment location → Destination address
- Appointment time → Scheduled pickup time
- Appointment description → Trip notes

**Filtering Logic:**
We only want transport-related appointments, identified by:
- Keywords in title/description: "transport", "pickup", "ride", "cab"
- Staff names in participants (transport coordinators)
- Specific appointment types or categories

**Client Matching:**
- Match appointment participants to existing clients by name
- Handle name variations (nicknames, middle names)
- Create new clients if no match found (optional)

### Technical Implementation

**Webhook Endpoint:**
```
POST /api/webhooks/webhook/{integration_id}
Content-Type: application/json
```

**Expected Payload Structure:**
```json
{
  "event_type": "appointment.created",
  "appointment": {
    "id": "appt_123",
    "title": "CAB: In Person Court Appointment",
    "description": "Seth picking up at 7:45a. Client needs transport to courthouse.",
    "start_datetime": "2025-07-10T08:30:00Z",
    "end_datetime": "2025-07-10T09:30:00Z",
    "location": "Linsey Flanigan Courthouse: 520 W Colfax Ave, Denver, CO 80204",
    "participants": [
      {"name": "Jackson Hurd", "role": "Staff"},
      {"name": "Seth Brown", "role": "Staff"},
      {"name": "Collin Anthony Blevins", "role": "Client"}
    ]
  }
}
```

**Processing Logic:**
1. Validate webhook signature
2. Check if appointment matches transport criteria
3. Find matching client in organization
4. Calculate pickup time (appointment time - offset)
5. Create trip with default settings
6. Log event for monitoring

### Security & Privacy

**HIPAA Compliance:**
- Only transport-related appointments shared
- No sensitive medical information transmitted
- Secure webhook endpoints with signature verification
- Audit logging for all webhook events

**Data Isolation:**
- Each organization's data completely separate
- Role-based access controls
- Encrypted connections (TLS)

### Error Handling

**Common Scenarios:**
- No matching client found → Log error, optionally create new client
- Appointment too soon → Skip creation, log reason
- Duplicate appointments → Check existing trips, avoid duplicates
- Invalid data → Log error, return success to prevent retries

### Monitoring & Logging

**Integration Dashboard:**
- Webhook delivery success/failure rates
- Event processing logs
- Trip creation statistics
- Error monitoring and alerts

This integration will eliminate double-entry between Ritten and transport management while maintaining privacy by only sharing transport-relevant appointments.

## Detailed Application Workflow

### Current Manual Trip Creation Process
1. **Reception/Admin receives transport request** (phone, email, or walk-in)
2. **Admin logs into transport management system**
3. **Admin creates trip:**
   - Selects organization from dropdown
   - Chooses existing client or creates new client
   - Enters pickup address (often client's home)
   - Enters destination address (appointment location)
   - Sets pickup time (calculated to arrive on time)
   - Assigns driver (optional - can be auto-assigned)
   - Adds notes (special instructions, contact info)
4. **Trip appears in driver's mobile app immediately**
5. **Driver receives push notification**
6. **Driver manages trip through mobile app:**
   - Accepts/declines trip
   - Updates status: "En route to pickup" → "Arrived at pickup" → "Client onboard" → "Arrived at destination" → "Trip completed"
   - Tracks GPS location throughout journey
   - Records actual pickup/dropoff times
   - Adds notes about trip issues or client needs

### Who Creates Trips Currently
- **Organization Admins**: Primary trip creators (90% of trips)
- **Super Admins**: Cross-organizational trip management
- **Booking Kiosks**: Limited self-service terminals for routine appointments
- **Drivers**: Can modify trip details but rarely create new trips

### Security & Compliance Framework

**HIPAA Compliance:**
- **Minimum Necessary Standard**: Only transport-related appointment data is transmitted
- **Data Encryption**: All communications use TLS 1.3 encryption
- **Access Logging**: Every webhook event and user action is logged with timestamps
- **Role-Based Access**: Strict user permissions based on organizational roles
- **Data Retention**: Configurable retention periods (default: 7 years)
- **Audit Trails**: Complete audit logs for compliance reporting

**Security Measures:**
- **Webhook Signature Verification**: HMAC-SHA256 signatures prevent tampering
- **IP Whitelisting**: Restrict webhook sources to approved Ritten servers
- **Rate Limiting**: Prevent abuse with configurable request limits
- **Database Encryption**: All sensitive data encrypted at rest
- **Session Management**: Secure session tokens with automatic expiration
- **Multi-Factor Authentication**: Available for all admin accounts

**Data Privacy:**
- **Tenant Isolation**: Each organization's data completely separated
- **Field-Level Encryption**: PHI fields encrypted with organization-specific keys
- **Anonymization**: Option to anonymize data after retention period
- **Data Minimization**: Only essential fields stored and transmitted

## Bilateral Integration Capabilities

### Ritten → Transport System (Implemented)
**Automatic Trip Creation:**
- Ritten appointment with transport keywords → Trip created in transport system
- Client matching by name from appointment participants
- Pickup time calculated from appointment time minus travel buffer
- Trip status: "Scheduled" or "Confirmed" based on integration rules

### Transport System → Ritten (Proposed)
**Reverse Synchronization Options:**

**Option 1: Trip Status Updates to Ritten**
- When driver updates trip status → API call to Ritten
- Update appointment notes with transport status
- Possible statuses: "Driver en route", "Client picked up", "Arrived at appointment", "Transport completed"

**Option 2: Trip Creation from Transport System**
- Admin creates trip in transport system → Creates corresponding appointment in Ritten
- Useful for transport-only appointments (pharmacy runs, grocery trips)
- Maintains single source of truth for all client appointments

**Technical Requirements for Bilateral Integration:**
- Ritten API access (not just webhooks)
- OAuth or API key authentication
- Ability to create/update appointments via API
- Field mapping for transport-specific data

## Notification & Communication Workflows

### Current Notification System
**Driver Notifications:**
- Push notifications to mobile app
- SMS alerts for urgent trips
- Email summaries for daily schedules

**Admin Notifications:**
- Email alerts for trip completion
- SMS for emergency situations
- Dashboard notifications for status changes

### Enhanced Notification Options for Ritten Integration

**Option 1: Direct SMS to Ritten Admins**
- Integration with Twilio or similar SMS service
- Configurable phone numbers per organization
- Automated messages: "Trip confirmed", "Driver en route", "Client arrived"
- Two-way SMS for basic responses

**Option 2: Email Integration**
- Formatted email reports sent to Ritten admins
- Real-time trip status updates
- Daily/weekly summary reports
- Integration with organization's email system

**Option 3: Ritten Dashboard Integration**
- Real-time trip status displayed in Ritten interface
- Embedded transport dashboard within Ritten
- Single sign-on (SSO) between systems

**Option 4: API-Based Status Updates**
- Trip status changes trigger API calls to Ritten
- Updates appointment notes with transport status
- Maintains transport history within Ritten appointment records

### Recommended Notification Workflow for Ritten Users

**Immediate Solution (No Additional Ritten Development):**
1. **Ritten Admin schedules appointment** with transport keywords
2. **Webhook creates trip** in transport system
3. **Transport system sends email/SMS** to designated admin with trip details
4. **Driver status updates trigger SMS/email** to same admin
5. **Admin has access to transport system** for detailed monitoring

**Enhanced Solution (Requires Ritten API Development):**
1. **Ritten Admin schedules appointment** with transport keywords
2. **Webhook creates trip** in transport system
3. **Trip status updates automatically sync** back to Ritten appointment notes
4. **Ritten Admin sees transport status** directly in appointment interface
5. **No need to check separate system** for transport updates

## Implementation Phases

### Phase 1: Basic Integration (Ready to Deploy)
- Webhook-based trip creation from Ritten appointments
- Email/SMS notifications to designated admins
- Manual monitoring via transport system dashboard

### Phase 2: Enhanced Notifications (2-4 weeks)
- Automated SMS/email alerts for trip status changes
- Customizable notification preferences per organization
- Integration with existing communication systems

### Phase 3: Bilateral Synchronization (6-8 weeks)
- Trip status updates sync back to Ritten appointments
- Transport system trip creation creates Ritten appointments
- Full two-way data synchronization

### Phase 4: Embedded Dashboard (8-12 weeks)
- Transport dashboard embedded within Ritten interface
- Single sign-on integration
- Real-time status updates without system switching

## Privacy & Access Questions We Can Answer

**Q: Who has access to transport data?**
A: Only authorized users within each organization. Super admins can access cross-organizational data but this is limited to 1-2 personnel.

**Q: How is PHI protected during transmission?**
A: All data transmitted via TLS 1.3 encryption, webhook signatures prevent tampering, and only transport-relevant data is shared.

**Q: Can Ritten admins access the transport system directly?**
A: Yes, we provide dedicated admin accounts for each organization with appropriate role-based permissions.

**Q: What happens if the integration fails?**
A: Manual trip creation remains available as fallback. All webhook failures are logged and can be replayed once connection is restored.

**Q: How do we ensure appointment privacy?**
A: Only appointments containing transport keywords are transmitted. Full treatment schedules remain private within Ritten.

**Q: Who can modify integration settings?**
A: Only organization admins and super admins can modify webhook configurations and filtering rules.

The system is production-ready and HIPAA-compliant. We need to establish the technical connection and configure the filtering rules for each organization.