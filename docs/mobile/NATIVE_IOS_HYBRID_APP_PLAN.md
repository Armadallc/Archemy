# Native iOS App Plan: Driver-Only + Separate PWAs

## Overview

**Simplified Architecture:**
1. **Native iOS app** - Drivers only (location tracking critical)
2. **PWA for clients** - No location tracking needed, PWA is perfect
3. **PWA for admins** - Distilled version (booking, chat, notifications)

**Why This Approach:**
- ✅ Simpler architecture (no WebView complexity)
- ✅ Focus native development on critical driver features
- ✅ PWAs work great for clients/admins (no location tracking)
- ✅ Easier maintenance (separate apps for separate use cases)
- ✅ Better performance (native for drivers, optimized PWAs for others)

## Architecture: Three Separate Apps

### Simplified Three-App Approach

```
┌─────────────────────────────────────────┐
│      Native iOS App (Expo)             │
│      DRIVERS ONLY                       │
├─────────────────────────────────────────┤
│  ✅ Location tracking (background)      │
│  ✅ Trip management                     │
│  ✅ Emergency button                    │
│  ✅ Push notifications                  │
│  ✅ Driver profile                      │
└──────────────┬──────────────────────────┘
               │
               │  Same Backend API
               │  Same Database
               │
┌──────────────▼──────────────────────────┐
│      Admin PWA (Distilled)              │
│      - Booking/Calendar                 │
│      - Chat                             │
│      - Notifications                    │
│      - Mobile-optimized                 │
└──────────────┬──────────────────────────┘
               │
               │  Same Backend API
               │  Same Database
               │
┌──────────────▼──────────────────────────┐
│      Client PWA                         │
│      - Notifications                    │
│      - Curriculum forms (Archemy)       │
│      - Profile                          │
│      - Mobile-optimized                 │
└─────────────────────────────────────────┘
               │
               │  Same Backend API
               │  Same Database
               │
┌──────────────▼──────────────────────────┐
│      Full Web App (Desktop)             │
│      - Complete admin dashboard         │
│      - All features                     │
│      - Desktop/tablet optimized         │
└─────────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Native Driver App (Current Priority) ✅

**Focus:** Core driver functionality with native features

**Screens:**
- Login/Authentication (native)
- Dashboard (native)
- Trip Management (native)
- Location Tracking (native - critical)
- Emergency Button (native)
- Profile (native)
- Notifications (native push notifications)

**Why Native:**
- Background location tracking requires native APIs
- Better performance for real-time features
- Full device access (camera, notifications, etc.)

**Timeline:** 2-3 weeks

### Phase 2: Admin PWA (Distilled Version) ⏳

**Focus:** Create a mobile-optimized PWA for admins

**Features to Include:**
- Booking/Calendar (simplified)
- Chat/Messaging
- Notifications
- Quick client lookup

**Implementation:**
- Create new routes: `/admin-mobile/*`
- Mobile-optimized components
- PWA manifest configuration
- Add to home screen capability

**Why PWA:**
- No location tracking needed
- Easier to maintain (web technologies)
- Instant updates
- Works on iOS and Android

**Timeline:** 1-2 weeks (after driver app)

### Phase 3: Client PWA ⏳

**Focus:** Create a PWA for clients

**Features to Include:**
- Notifications
- Curriculum forms (Archemy)
- Profile viewing
- Appointment viewing

**Implementation:**
- Create new routes: `/client/*`
- Mobile-optimized components
- PWA manifest configuration
- Form completion flow

**Why PWA:**
- No location tracking needed
- Simple interface
- Easy to share/distribute
- Works on any device

**Timeline:** 1 week (after Archemy Clinical Module)

## Benefits of Three-App Approach

### 1. **Simpler Architecture** ✅
- No WebView complexity
- Each app optimized for its use case
- Clear separation of concerns

### 2. **Better Performance** ✅
- Native app for drivers (critical features)
- Optimized PWAs for admin/client (no heavy native features)
- Each app can be optimized independently

### 3. **Easier Development** ✅
- Focus native development on driver features only
- PWAs use existing web technologies
- No need to bridge native/web code

### 4. **Easier Maintenance** ✅
- Update PWAs independently
- Native app updates only when driver features change
- Shared backend API

### 5. **Better User Experience** ✅
- Drivers get native performance
- Admins get mobile-optimized PWA
- Clients get simple, focused PWA
- Each app tailored to user needs

### 6. **Archemy Integration** ✅
- Client forms in PWA (perfect for forms)
- No need for native form builder
- Leverage existing web form system

## Technical Implementation

### Native Driver App (Expo)

**Focus:** Driver-specific features only

**No WebView needed** - Pure native app

**Key Features:**
- Background location tracking
- Trip management
- Emergency button
- Push notifications
- Camera integration

### Admin PWA Setup

**Create:** `client/src/pages/admin-mobile/`

**Routes:**
- `/admin-mobile/booking` - Simplified booking interface
- `/admin-mobile/chat` - Chat/messaging
- `/admin-mobile/notifications` - Notifications
- `/admin-mobile/dashboard` - Quick stats

**PWA Manifest:**
```json
// client/public/manifest-admin.json
{
  "name": "HALCYON Admin",
  "short_name": "HALCYON Admin",
  "description": "HALCYON Admin Mobile App",
  "start_url": "/admin-mobile",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "icons": [...]
}
```

### Client PWA Setup

**Create:** `client/src/pages/client/`

**Routes:**
- `/client/notifications` - Notifications
- `/client/forms/:sessionId` - Archemy curriculum forms
- `/client/profile` - Profile viewing
- `/client/appointments` - Appointment viewing

**PWA Manifest:**
```json
// client/public/manifest-client.json
{
  "name": "HALCYON Client",
  "short_name": "HALCYON Client",
  "description": "HALCYON Client App",
  "start_url": "/client",
  "display": "standalone",
  "theme_color": "#9b87f5",  // Archemy purple
  "background_color": "#ffffff",
  "icons": [...]
}
```

### Route Protection

**File:** `client/src/components/layout/main-layout.tsx`

```typescript
// Admin mobile routes
<Route path="/admin-mobile/*">
  <RequireAuth requiredRole={['admin', 'program_admin']}>
    <AdminMobileLayout />
  </RequireAuth>
</Route>

// Client routes
<Route path="/client/*">
  <RequireAuth requiredRole={['client']}>
    <ClientLayout />
  </RequireAuth>
</Route>
```

## Feature Breakdown

### Driver Features (Native)

- ✅ Location tracking (background)
- ✅ Trip management
- ✅ Emergency button
- ✅ Push notifications
- ✅ Camera (trip photos)
- ✅ Offline trip data

### Admin Features (WebView)

- ✅ Client booking/management
- ✅ Trip scheduling
- ✅ Chat/messaging
- ✅ Calendar views
- ✅ Archemy Clinical Module
- ✅ Analytics/dashboard
- ✅ Notifications

### Client Features (WebView)

- ✅ Notifications
- ✅ Curriculum forms (Archemy)
- ✅ Profile management
- ✅ Appointment viewing
- ✅ Form submissions

## Archemy Clinical Module Integration

### Client Form Completion

**From:** `docs/archemy/ARCHEMY_CLINICAL_MODULE_BUILD_PLAN.md`

**Implementation:**

1. **Web App Route:** `/archemy/client/forms/:sessionId`
   - Form template builder
   - Dynamic form rendering
   - Submission handling

2. **Native App WebView:**
   ```typescript
   // mobile/app/(tabs)/client-forms.tsx
   <WebView
     source={{
       uri: `${webAppUrl}/archemy/client/forms/${sessionId}?native=true`
     }}
     // ... WebView config
   />
   ```

3. **Benefits:**
   - Reuse existing form builder
   - No need to rebuild in native
   - Consistent form experience
   - Easy updates

### Notification Integration

**Native Push Notifications:**
- Receive notification in native app
- Tap notification → Open WebView to form
- Complete form in WebView
- Submit → Native app shows success

## Timeline & Phases

### Phase 1: Native Driver App (Now) ✅
**Duration:** 2-3 weeks
- Build native iOS app (Expo)
- Implement driver features
- Test location tracking
- Submit to App Store
- **Focus:** Driver-only, no WebView complexity

### Phase 2: Admin PWA (After Driver App)
**Duration:** 1-2 weeks
- Create `/admin-mobile/*` routes
- Build mobile-optimized components
- Implement booking, chat, notifications
- Configure PWA manifest
- Test on mobile devices

### Phase 3: Client PWA (After Archemy Module)
**Duration:** 1 week
- Create `/client/*` routes
- Integrate Archemy curriculum forms
- Build notification system
- Configure PWA manifest
- Test form completion flow

## Considerations

### Pros ✅

1. **Simpler Architecture:** No WebView complexity
2. **Better Performance:** Native for drivers, optimized PWAs for others
3. **Easier Development:** Focus on one app at a time
4. **Easier Maintenance:** Update each app independently
5. **Better UX:** Each app optimized for its use case
6. **Cost Effective:** One native app, two PWAs (free)

### Cons ⚠️

1. **Three Separate Apps:** Need to maintain three apps
2. **PWA Limitations:** Some iOS Safari limitations
3. **Distribution:** Need to guide users to add PWAs to home screen

### Mitigations

1. **Maintenance:** Shared backend API, shared components where possible
2. **PWA Limitations:** Use service workers, offline caching
3. **Distribution:** Clear instructions, onboarding flow

## Code Examples

### Admin PWA Route

```typescript
// client/src/pages/admin-mobile/booking.tsx
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";

export default function AdminMobileBooking() {
  const { user } = useAuth();
  
  return (
    <div className="admin-mobile-container">
      <header className="card-neu p-4 mb-4">
        <h1 className="text-2xl font-bold">Quick Booking</h1>
      </header>
      
      {/* Simplified booking interface */}
      <div className="space-y-4">
        {/* Mobile-optimized components */}
      </div>
    </div>
  );
}
```

### Client PWA Form Route

```typescript
// client/src/pages/client/forms/[sessionId].tsx
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { clinicalApi } from "../../lib/clinical-api";

export default function ClientForm() {
  const { sessionId } = useParams();
  
  const { data: form } = useQuery({
    queryKey: ["client-form", sessionId],
    queryFn: () => clinicalApi.getFormForSession(sessionId)
  });
  
  return (
    <div className="client-form-container">
      {/* Archemy form rendering */}
      {/* Mobile-optimized form UI */}
    </div>
  );
}
```

### PWA Manifest Configuration

```typescript
// client/vite.config.ts
export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin-mobile.html'),
        client: resolve(__dirname, 'client.html'),
      }
    }
  }
});
```

## Next Steps

### For Driver App (Now) ✅

1. ✅ Build native iOS app with driver features only
2. ✅ Implement location tracking (background)
3. ✅ Test location tracking thoroughly
4. ✅ Submit to App Store
5. ✅ Deploy to TestFlight for beta testing

### For Admin PWA (After Driver App) ⏳

1. ⏳ Create `/admin-mobile/*` routes in web app
2. ⏳ Build mobile-optimized booking interface
3. ⏳ Build mobile-optimized chat interface
4. ⏳ Build mobile-optimized notifications
5. ⏳ Configure PWA manifest for admin
6. ⏳ Test on mobile devices
7. ⏳ Create onboarding flow for "Add to Home Screen"

### For Client PWA (After Archemy Module) ⏳

1. ⏳ Complete Archemy Clinical Module (per build plan)
2. ⏳ Create `/client/*` routes in web app
3. ⏳ Build client notification interface
4. ⏳ Integrate Archemy curriculum forms
5. ⏳ Configure PWA manifest for client
6. ⏳ Test form completion flow
7. ⏳ Create onboarding flow for "Add to Home Screen"

## Conclusion

**Simplified Architecture: Three Separate Apps**

This approach gives you:
- ✅ **Native iOS app** - Drivers only (location tracking critical)
- ✅ **Admin PWA** - Mobile-optimized booking/chat/notifications
- ✅ **Client PWA** - Notifications and Archemy forms
- ✅ **Full Web App** - Complete desktop admin dashboard

**Benefits:**
- Simpler than WebView approach
- Each app optimized for its use case
- Easier to maintain and update
- Better performance (native where needed, PWA where sufficient)

**Recommendation:** 
1. **Now:** Focus on native driver app (2-3 weeks)
2. **Later:** Build admin PWA (1-2 weeks)
3. **After Archemy:** Build client PWA (1 week)

This is a cleaner, simpler architecture that avoids WebView complexity while still providing great experiences for all user types.

