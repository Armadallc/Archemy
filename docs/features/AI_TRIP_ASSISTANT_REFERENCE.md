# AI Trip Scheduling Assistant - Implementation Reference

**Status**: Future Feature (Non-Critical)  
**Created**: 2025-01-24  
**Target**: Implement when beneficial for user workflow

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Technical Specifications](#technical-specifications)
3. [Integration Points](#integration-points)
4. [Multi-Tenant Scoping](#multi-tenant-scoping)
5. [Cost Estimation Framework](#cost-estimation-framework)
6. [Implementation Phases](#implementation-phases)
7. [Code Examples](#code-examples)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Considerations](#deployment-considerations)
10. [Success Metrics](#success-metrics)

---

## Feature Overview

### Goal

Integrate an AI assistant powered by Anthropic Claude that converts natural language trip descriptions into structured trip data for the HALCYON transport management system. Users can describe trips in plain English and have the AI generate properly formatted trip records that can be reviewed and edited before saving.

### Key Benefits

- **Faster Trip Creation**: Reduce time to create trips from minutes to seconds
- **Natural Language Input**: Users describe trips conversationally
- **Multi-Tenant Aware**: AI respects user roles and data scoping
- **Preview & Edit**: Generated trips can be reviewed and modified before saving
- **Learning System**: Feedback mechanism to improve accuracy over time

### User Experience Flow

1. User clicks "Create Trip with AI" button
2. User types natural language description (e.g., "Pickup John Smith from detox at 9am for therapy appointment at downtown clinic")
3. AI processes request and generates structured trip data
4. User reviews AI-generated trip in preview component
5. User can edit any fields before saving
6. User provides feedback (thumbs up/down) to improve AI accuracy

---

## Technical Specifications

### AI Integration Stack

- **AI Provider**: Anthropic Claude
- **Model**: `claude-3-5-sonnet-20241022` or latest available version
- **SDK**: `@anthropic-ai/sdk` (npm package)
- **Response Format**: Structured JSON via tool use
- **Context**: Multi-tenant aware (respects user roles and data scoping)

### Core Features

1. **Natural Language to Structured Data**: Convert user descriptions into trip objects
2. **Multi-Tenant Awareness**: Only suggest clients/drivers/locations within user's scope
3. **Preview & Edit**: Show AI-generated trip for review before saving
4. **Learning Feedback**: Log interactions to improve accuracy over time
5. **Fallback Handling**: Graceful degradation if AI service unavailable

---

## Integration Points

### Existing Trip Creation System

The AI assistant will integrate alongside existing trip creation forms:

#### Primary Integration Point: `simple-booking-form.tsx`

**Location**: `client/src/components/booking/simple-booking-form.tsx`

**Current Structure**:
- Uses `useAuth()` for user context
- Uses `useHierarchy()` for program/corporate client selection
- Fetches clients, drivers, locations based on user scope
- Creates trips via `POST /api/trips` endpoint
- Supports individual and group trips
- Supports recurring trips (feature flag)

**Integration Approach**:
- Add AI assistant as a tab/option alongside manual form
- Share same form state management
- Use same validation and submission logic
- Leverage existing data fetching hooks

#### Secondary Integration Point: `quick-booking-form.tsx`

**Location**: `client/src/components/booking/quick-booking-form.tsx`

**Integration Approach**:
- Add AI button/option to quick booking form
- Simpler interface for quick AI trip creation
- Same validation and submission flow

#### Backend Integration: `server/routes/trips.ts`

**Location**: `server/routes/trips.ts`

**Current Endpoint**: `POST /api/trips`

**Integration Approach**:
- AI-generated trips use same endpoint
- Same validation rules apply
- Same notification system triggers
- No changes needed to backend for basic AI integration

### Data Flow

```
User Input (Natural Language)
    ↓
AI Service (Anthropic Claude)
    ↓
Structured Trip Data (JSON)
    ↓
Preview Component (Editable)
    ↓
Validation (Same as Manual Entry)
    ↓
POST /api/trips
    ↓
Trip Created (Same Flow as Manual)
```

---

## Multi-Tenant Scoping

### Current Scoping System

The system uses role-based scoping via `scopeValidationService.ts`:

**Location**: `server/services/scopeValidationService.ts`

**User Roles**:
- `super_admin`: Can see all organizations, programs, locations
- `corporate_admin`: Can see all programs within their corporate client
- `program_admin`: Can see their primary program + authorized programs
- `program_user`: Can see their primary program + authorized programs
- `driver`: Limited scope (their assigned trips)

### Scoping Requirements for AI

The AI assistant must:

1. **Respect User Role**: Only suggest data within user's scope
2. **Filter Clients**: Only show clients from user's accessible programs
3. **Filter Drivers**: Only show drivers from user's accessible programs
4. **Filter Locations**: Only show locations from user's accessible programs
5. **Program Context**: Use current program selection from `useHierarchy()`

### Implementation Strategy

**Frontend Context Building**:
```typescript
// Get user scope information
const { user } = useAuth();
const { selectedProgram, selectedCorporateClient } = useHierarchy();

// Fetch scoped data
const { data: clients } = useQuery({
  queryKey: ['/api/clients', selectedProgram],
  queryFn: () => apiRequest('GET', `/api/clients?program_id=${selectedProgram}`)
});

// Pass to AI service
const aiContext = {
  userRole: user.role,
  programId: selectedProgram,
  corporateClientId: selectedCorporateClient,
  availableClients: clients.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })),
  availableDrivers: drivers.map(d => ({ id: d.id, name: d.name })),
  frequentLocations: locations.map(l => ({ id: l.id, name: l.name, address: l.address }))
};
```

**Backend Validation**:
- AI-generated trips must pass same validation as manual entries
- `requireProgramAccess('program_id')` middleware applies
- Same scope checks in `scopeValidationService.ts`

---

## Cost Estimation Framework

### Anthropic Claude Pricing (as of 2024)

**Claude 3.5 Sonnet**:
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

### Token Usage Estimation

#### Per Request Breakdown

**System Prompt**: ~1,500 tokens
- User role, organization context
- Available clients/drivers/locations list
- Response format instructions

**User Input**: ~50-200 tokens
- Natural language trip description
- Average: ~100 tokens

**AI Response**: ~300-500 tokens
- Structured JSON trip data
- Confidence score and notes
- Average: ~400 tokens

**Total per Request**: ~2,000 tokens
- Input: ~1,600 tokens
- Output: ~400 tokens

#### Cost per Request

- Input cost: 1,600 tokens × $3.00 / 1,000,000 = $0.0048
- Output cost: 400 tokens × $15.00 / 1,000,000 = $0.0060
- **Total per request**: ~$0.0108 (~1.1 cents)

#### Monthly Cost Projections

**Low Usage** (100 trips/month):
- 100 requests × $0.0108 = **$1.08/month**

**Medium Usage** (500 trips/month):
- 500 requests × $0.0108 = **$5.40/month**

**High Usage** (2,000 trips/month):
- 2,000 requests × $0.0108 = **$21.60/month**

**Very High Usage** (10,000 trips/month):
- 10,000 requests × $0.0108 = **$108/month**

### Cost Optimization Strategies

1. **Caching**: Cache common trip patterns to reduce API calls
2. **Batch Processing**: Group similar requests when possible
3. **Token Limits**: Set maximum token limits per request
4. **Usage Monitoring**: Track API usage and set alerts
5. **Feature Flag**: Enable/disable AI assistant per organization
6. **Rate Limiting**: Limit requests per user per day

### Budget Considerations

- **Development Phase**: Estimate 1,000 test requests = ~$11
- **Production**: Start with feature flag, monitor usage
- **Scaling**: Costs scale linearly with usage
- **ROI**: Time saved vs. API costs (if 1 minute saved per trip, worth ~$0.17 in time)

---

## Implementation Phases

### Phase 1: Core AI Service (Week 1)

**Goal**: Basic natural language to trip data conversion

**Tasks**:
1. Install Anthropic SDK: `npm install @anthropic-ai/sdk`
2. Create `server/services/tripAIService.ts`
3. Set up environment variables for API key
4. Create basic prompt engineering
5. Implement structured JSON response parsing
6. Create unit tests for AI service

**Files to Create**:
- `server/services/tripAIService.ts`
- `server/services/__tests__/tripAIService.test.ts`
- `.env.example` (add `ANTHROPIC_API_KEY`)

**Files to Modify**:
- `server/environment-config.ts` (add AI config)

### Phase 2: UI Integration (Week 1-2)

**Goal**: Integrate AI assistant into trip creation flow

**Tasks**:
1. Create `client/src/components/booking/AIAssistant.tsx`
2. Create `client/src/components/booking/TripPreview.tsx`
3. Add AI tab/button to `simple-booking-form.tsx`
4. Implement loading states and error handling
5. Add trip preview with edit capabilities
6. Connect to existing trip creation flow

**Files to Create**:
- `client/src/components/booking/AIAssistant.tsx`
- `client/src/components/booking/TripPreview.tsx`
- `client/src/hooks/useTripAI.ts`

**Files to Modify**:
- `client/src/components/booking/simple-booking-form.tsx`
- `client/src/components/booking/quick-booking-form.tsx`

### Phase 3: Multi-Tenant Context (Week 2)

**Goal**: Ensure AI respects user scoping

**Tasks**:
1. Pass user role and scope to AI service
2. Filter available clients/drivers/locations by user permissions
3. Add context-aware suggestions
4. Validate AI suggestions against user scope
5. Add scope validation tests

**Files to Modify**:
- `server/services/tripAIService.ts`
- `client/src/hooks/useTripAI.ts`
- `client/src/components/booking/AIAssistant.tsx`

### Phase 4: Learning System (Week 3)

**Goal**: Collect feedback to improve accuracy

**Tasks**:
1. Create feedback logging system
2. Add thumbs up/down UI component
3. Track accuracy metrics
4. Create prompt improvement pipeline
5. Add feedback analytics dashboard

**Files to Create**:
- `server/services/aiFeedbackService.ts`
- `client/src/components/booking/AIFeedback.tsx`
- `client/src/hooks/useAIFeedback.ts`
- Database migration for `ai_feedback` table

**Files to Modify**:
- `server/services/tripAIService.ts`
- `client/src/components/booking/AIAssistant.tsx`

### Phase 5: Polish & Optimization (Week 3-4)

**Goal**: Production-ready feature

**Tasks**:
1. Add feature flag for gradual rollout
2. Implement usage monitoring and alerts
3. Add cost tracking dashboard
4. Optimize prompt for better accuracy
5. Add comprehensive error handling
6. Performance optimization
7. User documentation

**Files to Create**:
- `docs/features/AI_TRIP_ASSISTANT_USER_GUIDE.md`
- Database migration for feature flags (if not exists)

**Files to Modify**:
- `server/services/tripAIService.ts`
- `client/src/components/booking/AIAssistant.tsx`
- Add feature flag check in components

---

## Code Examples

### 1. AI Service Layer

**File**: `server/services/tripAIService.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { getScopeForRole } from '../services/scopeValidationService';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface AITripRequest {
  userInput: string;
  userContext: {
    role: string;
    programId: string;
    corporateClientId?: string | null;
    availableClients: Array<{ id: string; name: string }>;
    availableDrivers: Array<{ id: string; name: string }>;
    frequentLocations: Array<{ id: string; name: string; address: string }>;
  };
}

export interface AITripResponse {
  client_id?: string;
  client_group_id?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string; // ISO format
  scheduled_return_time?: string;
  trip_type: 'one_way' | 'round_trip';
  passenger_count: number;
  driver_id?: string;
  trip_category_id?: string;
  special_requirements?: string;
  notes?: string;
  confidence: number; // 0-1 scale
  reasoning?: string; // Why AI made these choices
}

export async function generateTripFromNaturalLanguage(
  request: AITripRequest
): Promise<AITripResponse> {
  const { userInput, userContext } = request;

  // Build system prompt with user context
  const systemPrompt = buildSystemPrompt(userContext);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userInput,
        },
      ],
      tools: [
        {
          name: 'generate_trip',
          description: 'Generate structured trip data from natural language',
          input_schema: {
            type: 'object',
            properties: {
              client_id: { type: 'string', description: 'Client ID from available clients' },
              client_group_id: { type: 'string', description: 'Client group ID if group trip' },
              pickup_address: { type: 'string', description: 'Pickup location address' },
              dropoff_address: { type: 'string', description: 'Dropoff location address' },
              scheduled_pickup_time: { type: 'string', description: 'ISO 8601 datetime' },
              scheduled_return_time: { type: 'string', description: 'ISO 8601 datetime for round trips' },
              trip_type: { type: 'string', enum: ['one_way', 'round_trip'] },
              passenger_count: { type: 'number', description: 'Number of passengers' },
              driver_id: { type: 'string', description: 'Driver ID from available drivers' },
              trip_category_id: { type: 'string', description: 'Trip category ID' },
              special_requirements: { type: 'string', description: 'Special requirements' },
              notes: { type: 'string', description: 'Additional notes' },
              confidence: { type: 'number', description: 'Confidence score 0-1' },
              reasoning: { type: 'string', description: 'Explanation of choices' },
            },
            required: ['pickup_address', 'dropoff_address', 'scheduled_pickup_time', 'trip_type', 'passenger_count', 'confidence'],
          },
        },
      ],
    });

    // Extract tool use result
    const toolUse = message.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === 'tool_use' && block.name === 'generate_trip'
    );

    if (!toolUse) {
      throw new Error('AI did not return trip data');
    }

    const tripData = toolUse.input as AITripResponse;

    // Validate AI response
    validateAIResponse(tripData, userContext);

    return tripData;
  } catch (error) {
    console.error('Error generating trip from AI:', error);
    throw new Error('Failed to generate trip from AI');
  }
}

function buildSystemPrompt(userContext: AITripRequest['userContext']): string {
  const clientList = userContext.availableClients
    .map(c => `- ${c.name} (ID: ${c.id})`)
    .join('\n');

  const driverList = userContext.availableDrivers
    .map(d => `- ${d.name} (ID: ${d.id})`)
    .join('\n');

  const locationList = userContext.frequentLocations
    .map(l => `- ${l.name}: ${l.address} (ID: ${l.id})`)
    .join('\n');

  return `You are HALCYON AI Trip Assistant, a specialized AI that helps schedule medical transport trips.

CONTEXT:
- User Role: ${userContext.role}
- Program ID: ${userContext.programId}
${userContext.corporateClientId ? `- Corporate Client ID: ${userContext.corporateClientId}` : ''}

AVAILABLE DATA (ONLY USE THESE):
Available Clients:
${clientList || 'None'}

Available Drivers:
${driverList || 'None'}

Frequent Locations:
${locationList || 'None'}

RULES:
1. ONLY suggest clients, drivers, and locations from the available lists above
2. Infer trip type from context (one_way or round_trip)
3. Calculate passenger count from client mentions
4. Use MDT timezone (UTC-6) for all times
5. Return client_id OR client_group_id, not both
6. If multiple clients mentioned, use client_group_id if group trip, or create separate trips
7. Confidence score: 1.0 = very certain, 0.5 = somewhat certain, <0.5 = uncertain

RESPONSE FORMAT:
Return structured JSON with trip data. All fields must be valid and within user's scope.`;
}

function validateAIResponse(
  response: AITripResponse,
  userContext: AITripRequest['userContext']
): void {
  // Validate client_id is in available clients
  if (response.client_id) {
    const isValidClient = userContext.availableClients.some(
      c => c.id === response.client_id
    );
    if (!isValidClient) {
      throw new Error('AI suggested invalid client');
    }
  }

  // Validate driver_id is in available drivers
  if (response.driver_id) {
    const isValidDriver = userContext.availableDrivers.some(
      d => d.id === response.driver_id
    );
    if (!isValidDriver) {
      throw new Error('AI suggested invalid driver');
    }
  }

  // Validate required fields
  if (!response.pickup_address || !response.dropoff_address) {
    throw new Error('AI response missing required fields');
  }

  // Validate trip_type
  if (!['one_way', 'round_trip'].includes(response.trip_type)) {
    throw new Error('AI response has invalid trip_type');
  }
}
```

### 2. Frontend Hook

**File**: `client/src/hooks/useTripAI.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import type { AITripResponse } from '../../shared/types/ai';

interface UseTripAIOptions {
  userContext: {
    role: string;
    programId: string;
    corporateClientId?: string | null;
    availableClients: Array<{ id: string; name: string }>;
    availableDrivers: Array<{ id: string; name: string }>;
    frequentLocations: Array<{ id: string; name: string; address: string }>;
  };
}

export function useTripAI(options: UseTripAIOptions) {
  return useMutation({
    mutationFn: async (userInput: string): Promise<AITripResponse> => {
      const response = await apiRequest('POST', '/api/trips/ai/generate', {
        userInput,
        userContext: options.userContext,
      });
      return response.json();
    },
  });
}
```

### 3. AI Assistant Component

**File**: `client/src/components/booking/AIAssistant.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useTripAI } from '../../hooks/useTripAI';
import { useAuth } from '../../hooks/useAuth';
import { useHierarchy } from '../../hooks/useHierarchy';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { TripPreview } from './TripPreview';
import type { AITripResponse } from '../../../shared/types/ai';

interface AIAssistantProps {
  onTripGenerated: (tripData: AITripResponse) => void;
  onCancel: () => void;
}

export function AIAssistant({ onTripGenerated, onCancel }: AIAssistantProps) {
  const { user } = useAuth();
  const { selectedProgram, selectedCorporateClient } = useHierarchy();
  const [userInput, setUserInput] = useState('');

  // Fetch available data for AI context
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients', selectedProgram],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/clients?program_id=${selectedProgram}`);
      return response.json();
    },
    enabled: !!selectedProgram,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/drivers', selectedProgram],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/drivers?program_id=${selectedProgram}`);
      return response.json();
    },
    enabled: !!selectedProgram,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations', selectedProgram],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/locations?program_id=${selectedProgram}`);
      return response.json();
    },
    enabled: !!selectedProgram,
  });

  const aiMutation = useTripAI({
    userContext: {
      role: user?.role || '',
      programId: selectedProgram || '',
      corporateClientId: selectedCorporateClient,
      availableClients: clients.map((c: any) => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
      })),
      availableDrivers: drivers.map((d: any) => ({
        id: d.id,
        name: d.name || `${d.first_name} ${d.last_name}`,
      })),
      frequentLocations: locations.map((l: any) => ({
        id: l.id,
        name: l.name,
        address: l.address,
      })),
    },
  });

  const handleGenerate = () => {
    if (!userInput.trim()) return;
    aiMutation.mutate(userInput);
  };

  if (aiMutation.isSuccess && aiMutation.data) {
    return (
      <TripPreview
        tripData={aiMutation.data}
        onConfirm={onTripGenerated}
        onEdit={() => aiMutation.reset()}
        onCancel={onCancel}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Trip Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Describe your trip in natural language
          </label>
          <Textarea
            placeholder="e.g., Pickup John Smith from detox at 9am for therapy appointment at downtown clinic"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="min-h-[120px]"
            disabled={aiMutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            Describe who, where, when, and what type of trip you need.
          </p>
        </div>

        {aiMutation.isError && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {aiMutation.error instanceof Error
              ? aiMutation.error.message
              : 'Failed to generate trip. Please try again.'}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={aiMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!userInput.trim() || aiMutation.isPending}
          >
            {aiMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Trip'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Trip Preview Component

**File**: `client/src/components/booking/TripPreview.tsx`

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Check, X } from 'lucide-react';
import type { AITripResponse } from '../../../shared/types/ai';

interface TripPreviewProps {
  tripData: AITripResponse;
  onConfirm: (tripData: AITripResponse) => void;
  onEdit: () => void;
  onCancel: () => void;
}

export function TripPreview({
  tripData,
  onConfirm,
  onEdit,
  onCancel,
}: TripPreviewProps) {
  const confidenceColor =
    tripData.confidence >= 0.8
      ? 'bg-green-500'
      : tripData.confidence >= 0.6
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Generated Trip Preview</span>
          <Badge className={confidenceColor}>
            {Math.round(tripData.confidence * 100)}% Confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Pickup Location
            </label>
            <p className="text-sm">{tripData.pickup_address}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Dropoff Location
            </label>
            <p className="text-sm">{tripData.dropoff_address}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Scheduled Pickup Time
            </label>
            <p className="text-sm">
              {new Date(tripData.scheduled_pickup_time).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Trip Type
            </label>
            <p className="text-sm capitalize">{tripData.trip_type.replace('_', ' ')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Passengers
            </label>
            <p className="text-sm">{tripData.passenger_count}</p>
          </div>
        </div>

        {tripData.notes && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Notes
            </label>
            <p className="text-sm">{tripData.notes}</p>
          </div>
        )}

        {tripData.reasoning && (
          <div className="p-3 bg-muted rounded-md">
            <label className="text-sm font-medium text-muted-foreground">
              AI Reasoning
            </label>
            <p className="text-sm mt-1">{tripData.reasoning}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={() => onConfirm(tripData)}>
            <Check className="mr-2 h-4 w-4" />
            Confirm & Create Trip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. Backend API Route

**File**: `server/routes/trips.ts` (add new route)

```typescript
import { generateTripFromNaturalLanguage } from '../services/tripAIService';

// Add after existing routes
router.post(
  '/ai/generate',
  requireSupabaseAuth,
  requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']),
  async (req: SupabaseAuthenticatedRequest, res) => {
    try {
      const { userInput, userContext } = req.body;

      if (!userInput || typeof userInput !== 'string') {
        return res.status(400).json({ error: 'userInput is required' });
      }

      if (!userContext || !userContext.programId) {
        return res.status(400).json({ error: 'userContext with programId is required' });
      }

      // Validate user has access to the program
      const hasAccess = await validateProgramAccess(
        req.user?.userId || '',
        userContext.programId
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to program' });
      }

      const tripData = await generateTripFromNaturalLanguage({
        userInput,
        userContext: {
          ...userContext,
          role: req.user?.role || '',
        },
      });

      res.json(tripData);
    } catch (error) {
      console.error('Error in AI trip generation:', error);
      res.status(500).json({
        error: 'Failed to generate trip',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
```

---

## Testing Strategy

### Unit Tests

**File**: `server/services/__tests__/tripAIService.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTripFromNaturalLanguage } from '../tripAIService';

describe('tripAIService', () => {
  it('should generate trip from natural language', async () => {
    const mockContext = {
      role: 'program_admin',
      programId: 'program-1',
      availableClients: [{ id: 'client-1', name: 'John Smith' }],
      availableDrivers: [{ id: 'driver-1', name: 'Jane Doe' }],
      frequentLocations: [
        { id: 'loc-1', name: 'Detox Center', address: '123 Main St' },
      ],
    };

    const result = await generateTripFromNaturalLanguage({
      userInput: 'Pickup John Smith from detox at 9am',
      userContext: mockContext,
    });

    expect(result).toHaveProperty('pickup_address');
    expect(result).toHaveProperty('dropoff_address');
    expect(result).toHaveProperty('scheduled_pickup_time');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should validate client_id is in available clients', async () => {
    // Test that AI cannot suggest clients outside user's scope
  });

  it('should handle errors gracefully', async () => {
    // Test error handling when AI service fails
  });
});
```

### Integration Tests

- Test AI assistant component renders correctly
- Test trip preview shows generated data
- Test integration with existing trip creation flow
- Test multi-tenant scoping validation

### E2E Tests

- User describes trip in natural language
- AI generates trip data
- User reviews and confirms trip
- Trip is created successfully

---

## Deployment Considerations

### Environment Variables

**File**: `.env` (add to existing)

```bash
# Anthropic AI Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...
AI_ASSISTANT_ENABLED=true
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

### Feature Flag

Add feature flag to control AI assistant availability:

**Database Migration**:
```sql
INSERT INTO feature_flags (name, description, is_enabled, created_at)
VALUES (
  'ai_trip_assistant_enabled',
  'Enable AI Trip Assistant feature',
  false,
  NOW()
);
```

**Usage**:
```typescript
const { isEnabled } = useFeatureFlag('ai_trip_assistant_enabled');
if (!isEnabled) return null; // Hide AI assistant
```

### Monitoring & Alerts

1. **API Usage Tracking**: Log all Anthropic API calls
2. **Cost Monitoring**: Track token usage and costs
3. **Error Tracking**: Monitor AI service failures
4. **Performance Metrics**: Track response times
5. **User Adoption**: Track usage rates

### Security Considerations

1. **API Key Security**: Store in environment variables, never commit
2. **Input Sanitization**: Sanitize user input before sending to AI
3. **PII Handling**: Consider using client IDs instead of names in production
4. **Rate Limiting**: Limit requests per user to prevent abuse
5. **Validation**: Always validate AI responses before saving

### Rollout Strategy

1. **Phase 1**: Internal testing with super admins
2. **Phase 2**: Beta testing with select program admins
3. **Phase 3**: Gradual rollout to all users
4. **Phase 4**: Monitor usage and optimize

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Time Savings**: Average time to create trip (before vs. after)
2. **Adoption Rate**: % of trips created using AI assistant
3. **Accuracy**: % of AI-generated trips that need no edits
4. **User Satisfaction**: Feedback scores (thumbs up/down)
5. **Cost Efficiency**: API costs vs. time saved

### Target Metrics

- **Time Reduction**: 50% reduction in trip creation time
- **Adoption Rate**: 30% of trips created via AI within 3 months
- **Accuracy**: 80% of trips require no edits
- **User Satisfaction**: 4.5/5 average rating
- **Cost**: <$50/month for medium-sized organization

### Measurement Tools

1. **Analytics Dashboard**: Track usage and metrics
2. **User Feedback**: Collect thumbs up/down data
3. **Time Tracking**: Measure trip creation time
4. **Cost Tracking**: Monitor API usage and costs

---

## Additional Resources

### Anthropic Documentation

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude Models](https://docs.anthropic.com/claude/docs/models-overview)
- [Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)

### Related HALCYON Documentation

- `docs/project-management/TRIP_CREATION_FLOW_AUDIT.md`
- `server/services/scopeValidationService.ts`
- `client/src/components/booking/simple-booking-form.tsx`

### Implementation Checklist

- [ ] Phase 1: Core AI Service
- [ ] Phase 2: UI Integration
- [ ] Phase 3: Multi-Tenant Context
- [ ] Phase 4: Learning System
- [ ] Phase 5: Polish & Optimization
- [ ] Testing Complete
- [ ] Documentation Complete
- [ ] Feature Flag Enabled
- [ ] Monitoring Setup
- [ ] User Guide Created

---

**Last Updated**: 2025-01-24  
**Next Review**: When ready to implement

