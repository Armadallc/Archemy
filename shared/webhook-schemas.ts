import { z } from 'zod';

// Base webhook event schema
export const webhookEventSchema = z.object({
  id: z.string(),
  source: z.enum(['ritten', 'google_calendar', 'outlook', 'generic']),
  event_type: z.enum(['created', 'updated', 'deleted', 'cancelled']),
  timestamp: z.string(),
  organization_id: z.string(),
  event_data: z.object({
    event_id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    start_time: z.string(),
    end_time: z.string(),
    attendees: z.array(z.object({
      name: z.string(),
      email: z.string().optional(),
      role: z.enum(['client', 'therapist', 'admin']).optional()
    })).optional(),
    location: z.object({
      address: z.string().optional(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional()
    }).optional(),
    metadata: z.record(z.any()).optional()
  })
});

// Ritten-specific webhook schema
export const rittenWebhookSchema = z.object({
  event_type: z.string(),
  calendar_id: z.string(),
  appointment: z.object({
    id: z.string(),
    title: z.string(),
    start_datetime: z.string(),
    end_datetime: z.string(),
    client_name: z.string(),
    client_email: z.string().optional(),
    therapist_name: z.string(),
    location: z.string().optional(),
    notes: z.string().optional(),
    service_type: z.string().optional(),
    status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed']).optional()
  }),
  organization: z.object({
    id: z.string(),
    name: z.string()
  }).optional()
});

// Trip creation rules schema
export const tripCreationRuleSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  
  // Trigger conditions
  trigger_conditions: z.object({
    calendar_sources: z.array(z.string()), // ['ritten', 'google_calendar']
    event_types: z.array(z.string()), // ['created', 'updated']
    keywords: z.array(z.string()).optional(), // Keywords in event title/description
    time_filters: z.object({
      advance_notice_hours: z.number().optional(), // Only create trips for events X hours in advance
      business_hours_only: z.boolean().optional()
    }).optional()
  }),
  
  // Trip creation settings
  trip_settings: z.object({
    auto_create: z.boolean().default(true),
    trip_type: z.enum(['pickup_only', 'dropoff_only', 'round_trip']).default('round_trip'),
    default_pickup_location: z.string().optional(), // Service area ID or address
    default_dropoff_location: z.string().optional(),
    pickup_time_offset_minutes: z.number().default(-30), // Pick up 30 minutes before appointment
    dropoff_time_offset_minutes: z.number().default(15), // Drop off 15 minutes after appointment
    default_driver_id: z.string().optional(),
    priority_level: z.enum(['low', 'medium', 'high']).default('medium'),
    requires_approval: z.boolean().default(false)
  }),
  
  // Client mapping
  client_mapping: z.object({
    match_by: z.enum(['name', 'email', 'phone', 'custom_id']).default('name'),
    create_missing_clients: z.boolean().default(false),
    default_service_area_id: z.string().optional()
  }),
  
  created_at: z.string(),
  updated_at: z.string()
});

// Webhook integration settings
export const webhookIntegrationSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  provider: z.enum(['ritten', 'google_calendar', 'outlook', 'generic']),
  
  // Configuration
  config: z.object({
    webhook_url: z.string().url(),
    secret_key: z.string().optional(),
    api_key: z.string().optional(),
    calendar_ids: z.array(z.string()).optional(),
    
    // Authentication details
    auth_type: z.enum(['none', 'api_key', 'oauth', 'hmac_signature']).default('none'),
    auth_config: z.record(z.any()).optional()
  }),
  
  // Status and monitoring
  status: z.enum(['active', 'inactive', 'error']).default('active'),
  last_sync: z.string().optional(),
  sync_errors: z.array(z.string()).optional(),
  
  // Associated trip creation rules
  trip_creation_rules: z.array(z.string()), // Rule IDs
  
  created_at: z.string(),
  updated_at: z.string()
});

// Webhook event log schema
export const webhookEventLogSchema = z.object({
  id: z.string(),
  integration_id: z.string(),
  organization_id: z.string(),
  
  // Event details
  event_type: z.string(),
  payload: z.record(z.any()),
  processed_at: z.string(),
  
  // Processing results
  status: z.enum(['success', 'error', 'skipped']),
  trips_created: z.array(z.string()).optional(), // Trip IDs created
  error_message: z.string().optional(),
  
  created_at: z.string()
});

// Type exports
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type RittenWebhook = z.infer<typeof rittenWebhookSchema>;
export type TripCreationRule = z.infer<typeof tripCreationRuleSchema>;
export type WebhookIntegration = z.infer<typeof webhookIntegrationSchema>;
export type WebhookEventLog = z.infer<typeof webhookEventLogSchema>;