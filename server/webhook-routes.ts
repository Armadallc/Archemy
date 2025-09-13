import { Router } from 'express';
import { z } from 'zod';
import { supabase } from './db';
import { nanoid } from 'nanoid';
import { requireAuth } from './auth';
import crypto from 'crypto';

const router = Router();

// Ritten webhook payload schema
const rittenWebhookSchema = z.object({
  event_type: z.string(),
  event_id: z.string(),
  calendar_id: z.string(),
  appointment: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    start_datetime: z.string(),
    end_datetime: z.string(),
    attendees: z.array(z.object({
      name: z.string(),
      email: z.string().optional()
    })).optional(),
    location: z.string().optional(),
    notes: z.string().optional()
  }),
  organization: z.object({
    id: z.string(),
    name: z.string()
  }).optional()
});

// Generic webhook receiver endpoint
router.post('/webhook/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const payload = req.body;
    
    console.log(`🔗 Webhook received for integration ${integrationId}:`, payload);
    
    // Get integration configuration
    const { data: integration, error } = await supabase
      .from('webhook_integrations')
      .select('*')
      .eq('id', integrationId)
      .limit(1);
    
    if (error || !integration?.length) {
      console.error(`❌ Integration ${integrationId} not found:`, error);
      return res.status(404).json({ error: 'Integration not found' });
    }
    
    const config = integration[0];
    
    // Validate webhook signature if secret key is configured
    if (config.secret_key) {
      const signature = req.headers['x-webhook-signature'] as string;
      const expectedSignature = crypto
        .createHmac('sha256', config.secret_key)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error(`❌ Invalid webhook signature for integration ${integrationId}`);
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Log the webhook event
    const logId = nanoid();
    const { error: logError } = await supabase.from('webhook_event_logs').insert({
      id: logId,
      integration_id: integrationId,
      organization_id: config.organization_id,
      event_type: payload.event_type || 'unknown',
      event_data: payload,
      status: 'success',
      created_at: new Date()
    });
    
    // Process the webhook based on provider
    let processResult;
    if (config.provider === 'ritten') {
      processResult = await processRittenWebhook(config, payload);
    } else {
      processResult = await processGenericWebhook(config, payload);
    }
    
    // Update log with processing results
    await supabase
      .from('webhook_event_logs')
      .update({
        status: processResult.success ? 'success' : 'error',
        trips_created: processResult.tripsCreated,
        error_message: processResult.error
      })
      .eq('id', logId);
    
    res.json({ 
      success: true, 
      processed: processResult.success,
      tripsCreated: processResult.tripsCreated?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process Ritten.io webhook
async function processRittenWebhook(config: any, payload: any) {
  try {
    const validatedPayload = rittenWebhookSchema.parse(payload);
    
    // Check if this event should trigger trip creation
    const shouldCreateTrip = await shouldCreateTripForEvent(config, validatedPayload);
    
    if (!shouldCreateTrip.create) {
      return { 
        success: true, 
        tripsCreated: [], 
        reason: shouldCreateTrip.reason 
      };
    }
    
    // Create trip from appointment
    const tripId = await createTripFromAppointment(config, validatedPayload);
    
    return {
      success: true,
      tripsCreated: [tripId]
    };
    
  } catch (error) {
    console.error('❌ Ritten webhook processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Process generic webhook
async function processGenericWebhook(config: any, payload: any) {
  // Basic processing for other calendar providers
  return {
    success: true,
    tripsCreated: []
  };
}

// Check if event should trigger trip creation
async function shouldCreateTripForEvent(config: any, payload: any) {
  const { appointment } = payload;
  
  // Check keyword filters
  if (config.filter_keywords && config.filter_keywords.length > 0) {
    const titleAndDescription = `${appointment.title} ${appointment.description || ''}`.toLowerCase();
    const hasKeyword = config.filter_keywords.some((keyword: string) => 
      titleAndDescription.includes(keyword.toLowerCase())
    );
    
    if (!hasKeyword) {
      return { 
        create: false, 
        reason: 'No matching keywords found' 
      };
    }
  }
  
  // Check attendee filters
  if (config.filter_attendees && config.filter_attendees.length > 0) {
    const attendeeNames = (appointment.attendees || []).map((a: any) => a.name.toLowerCase());
    const hasAttendee = config.filter_attendees.some((attendee: string) => 
      attendeeNames.includes(attendee.toLowerCase())
    );
    
    if (!hasAttendee) {
      return { 
        create: false, 
        reason: 'No matching attendees found' 
      };
    }
  }
  
  // Check time advance requirements
  const appointmentTime = new Date(appointment.start_datetime);
  const now = new Date();
  const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilAppointment < 2) { // Default 2 hours minimum
    return { 
      create: false, 
      reason: 'Appointment too soon (less than 2 hours advance notice)' 
    };
  }
  
  return { create: true };
}

// Create trip from appointment
async function createTripFromAppointment(config: any, payload: any) {
  const { appointment } = payload;
  
  // Get trip creation rules for this integration
  const { data: rules, error: rulesError } = await supabase
    .from('trip_creation_rules')
    .select('*')
    .eq('integration_id', config.id)
    .eq('is_active', true);
  
  const rule = rules?.[0]; // Use first active rule
  
  if (!rule) {
    throw new Error('No active trip creation rules found');
  }
  
  // Try to find matching client
  let clientId = null;
  if (appointment.attendees && appointment.attendees.length > 0) {
    const clientName = appointment.attendees[0].name;
    
    // Search for client by name
    const { data: existingClients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', config.organization_id);
    
    const matchingClient = existingClients?.find(client => 
      `${client.first_name} ${client.last_name}`.toLowerCase() === clientName.toLowerCase()
    );
    
    if (matchingClient) {
      clientId = matchingClient.id;
    }
  }
  
  if (!clientId) {
    throw new Error('No matching client found for appointment');
  }
  
  // Calculate pickup time (appointment time - offset)
  const appointmentTime = new Date(appointment.start_datetime);
  const pickupTime = new Date(appointmentTime.getTime() + (rule.pickup_offset_minutes * 60 * 1000));
  
  // Create trip
  const tripId = nanoid();
  const { error: tripError } = await supabase.from('trips').insert({
    id: tripId,
    organization_id: config.organization_id,
    client_id: clientId,
    pickup_address: rule.default_pickup_location || appointment.location || '',
    destination_address: appointment.location || '',
    scheduled_pickup_time: pickupTime,
    trip_type: rule.trip_type,
    status: rule.requires_approval ? 'scheduled' : 'confirmed',
    notes: `Auto-created from Ritten appointment: ${appointment.title}`,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  console.log(`✅ Created trip ${tripId} from Ritten appointment ${appointment.id}`);
  return tripId;
}

// Get webhook integrations for organization
router.get('/integrations/:organizationId', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const { data: integrations, error } = await supabase
      .from('webhook_integrations')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (error) throw error;
    res.json(integrations || []);
  } catch (error) {
    console.error('❌ Error fetching webhook integrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create webhook integration
router.post('/integrations', requireAuth, async (req, res) => {
  try {
    const integration = req.body;
    const integrationId = nanoid();
    
    const { error } = await supabase.from('webhook_integrations').insert({
      id: integrationId,
      ...integration,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    if (error) throw error;
    res.json({ id: integrationId, ...integration });
  } catch (error) {
    console.error('❌ Error creating webhook integration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get webhook event logs
router.get('/logs/:organizationId', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const { data: logs, error } = await supabase
      .from('webhook_event_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    res.json(logs || []);
  } catch (error) {
    console.error('❌ Error fetching webhook logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;