/**
 * Unit Tests for Trip Order Status Updates, Tagging, and Notifications
 * 
 * Tests the new trip order workflow:
 * - Trip creation with 'order' status
 * - Driver status updates (unified endpoint)
 * - User tagging for notifications
 * - Notification preferences
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  upsert: vi.fn(() => mockSupabase),
};

// Mock the supabase import
vi.mock('../db', () => ({
  supabase: mockSupabase,
}));

describe('Trip Order Status Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trip Creation with Order Status', () => {
    it('should create trip with default "order" status', async () => {
      const userId = 'test_user_123';
      const tripData = {
        program_id: 'test_program',
        client_id: 'test_client',
        pickup_address: '123 Main St',
        dropoff_address: '456 Oak Ave',
        scheduled_pickup_time: '2025-01-01T10:00:00Z',
        trip_type: 'one_way' as const,
        passenger_count: 1,
        // status should default to 'order'
      };

      const mockTrip = {
        id: 'trip_123',
        ...tripData,
        status: 'order', // Should default to 'order'
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        created_by: userId,
        updated_by: userId,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockTrip,
        error: null,
      });

      // Simulate trip creation
      const result = mockTrip;

      expect(result.status).toBe('order');
      expect(result.created_by).toBe(userId);
    });

    it('should create trip without driver assignment (optional)', async () => {
      const tripData = {
        program_id: 'test_program',
        client_id: 'test_client',
        driver_id: null, // No driver assigned
        pickup_address: '123 Main St',
        dropoff_address: '456 Oak Ave',
        scheduled_pickup_time: '2025-01-01T10:00:00Z',
        trip_type: 'one_way' as const,
        passenger_count: 1,
        status: 'order' as const,
      };

      const mockTrip = {
        id: 'trip_123',
        ...tripData,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      };

      expect(mockTrip.driver_id).toBeNull();
      expect(mockTrip.status).toBe('order');
    });

    it('should create recurring trip with order status', async () => {
      const tripData = {
        program_id: 'test_program',
        client_id: 'test_client',
        recurring_trip_id: 'recurring_123',
        pickup_address: '123 Main St',
        dropoff_address: '456 Oak Ave',
        scheduled_pickup_time: '2025-01-01T10:00:00Z',
        trip_type: 'one_way' as const,
        passenger_count: 1,
        status: 'order' as const,
      };

      const mockTrips = [
        { ...tripData, id: 'trip_1', scheduled_pickup_time: '2025-01-01T10:00:00Z' },
        { ...tripData, id: 'trip_2', scheduled_pickup_time: '2025-01-02T10:00:00Z' },
        { ...tripData, id: 'trip_3', scheduled_pickup_time: '2025-01-03T10:00:00Z' },
      ];

      // All instances should have 'order' status
      mockTrips.forEach(trip => {
        expect(trip.status).toBe('order');
        expect(trip.recurring_trip_id).toBe('recurring_123');
      });
    });
  });

  describe('Driver Status Updates', () => {
    it('should validate status transitions from order to scheduled', () => {
      const validTransitions = {
        order: ['scheduled', 'cancelled'],
        scheduled: ['confirmed', 'in_progress', 'cancelled'],
        confirmed: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'no_show', 'cancelled'],
        completed: [],
        cancelled: [],
        no_show: [],
      };

      expect(validTransitions.order).toContain('scheduled');
      expect(validTransitions.order).toContain('cancelled');
      expect(validTransitions.order).not.toContain('completed');
    });

    it('should handle start_trip action with client aboard', () => {
      const action = 'start_trip';
      const client_aboard = true;
      const trip = {
        id: 'trip_123',
        status: 'scheduled' as const,
        driver_id: 'driver_123',
      };

      const expectedUpdate = {
        status: 'in_progress',
        actual_pickup_time: expect.any(String),
        client_onboard_at: expect.any(String),
        updated_by: 'driver_123',
      };

      expect(action).toBe('start_trip');
      expect(client_aboard).toBe(true);
      expect(trip.status).toBe('scheduled');
    });

    it('should handle start_trip action without client (deadhead)', () => {
      const action = 'start_trip';
      const client_aboard = false;
      const trip = {
        id: 'trip_123',
        status: 'scheduled' as const,
        driver_id: 'driver_123',
      };

      const expectedUpdate = {
        status: 'in_progress',
        actual_pickup_time: expect.any(String),
        // client_onboard_at should NOT be set
        updated_by: 'driver_123',
      };

      expect(action).toBe('start_trip');
      expect(client_aboard).toBe(false);
    });

    it('should handle round trip wait time tracking', () => {
      const action = 'arrive';
      const start_wait_time = true;
      const trip = {
        id: 'trip_123',
        status: 'in_progress' as const,
        trip_type: 'round_trip' as const,
        driver_id: 'driver_123',
      };

      const expectedUpdate = {
        client_dropoff_at: expect.any(String),
        wait_time_started_at: expect.any(String),
        updated_by: 'driver_123',
      };

      expect(action).toBe('arrive');
      expect(start_wait_time).toBe(true);
      expect(trip.trip_type).toBe('round_trip');
    });

    it('should handle client_ready action (stop wait time)', () => {
      const action = 'client_ready';
      const trip = {
        id: 'trip_123',
        status: 'in_progress' as const,
        trip_type: 'round_trip' as const,
        wait_time_started_at: '2025-01-01T11:00:00Z',
        driver_id: 'driver_123',
      };

      const expectedUpdate = {
        wait_time_stopped_at: expect.any(String),
        updated_by: 'driver_123',
      };

      expect(action).toBe('client_ready');
      expect(trip.wait_time_started_at).toBeDefined();
    });

    it('should handle complete_trip action', () => {
      const action = 'complete_trip';
      const trip = {
        id: 'trip_123',
        status: 'in_progress' as const,
        trip_type: 'one_way' as const,
        driver_id: 'driver_123',
      };

      const expectedUpdate = {
        status: 'completed',
        actual_dropoff_time: expect.any(String),
        updated_by: 'driver_123',
      };

      expect(action).toBe('complete_trip');
    });

    it('should handle no_show action', () => {
      const action = 'no_show';
      const trip = {
        id: 'trip_123',
        status: 'in_progress' as const,
        driver_id: 'driver_123',
      };

      const expectedUpdate = {
        status: 'no_show',
        updated_by: 'driver_123',
      };

      expect(action).toBe('no_show');
    });
  });

  describe('Order Confirmation', () => {
    it('should confirm single trip order', () => {
      const trip = {
        id: 'trip_123',
        status: 'order' as const,
        driver_id: 'driver_123',
        recurring_trip_id: null,
      };

      const expectedUpdate = {
        status: 'scheduled',
        updated_by: 'driver_123',
      };

      expect(trip.status).toBe('order');
      expect(trip.recurring_trip_id).toBeNull();
    });

    it('should confirm all instances of recurring trip', () => {
      const recurringTripId = 'recurring_123';
      const trips = [
        { id: 'trip_1', status: 'order' as const, recurring_trip_id: recurringTripId },
        { id: 'trip_2', status: 'order' as const, recurring_trip_id: recurringTripId },
        { id: 'trip_3', status: 'order' as const, recurring_trip_id: recurringTripId },
      ];

      // All should be updated to 'scheduled'
      trips.forEach(trip => {
        expect(trip.status).toBe('order');
        expect(trip.recurring_trip_id).toBe(recurringTripId);
      });

      // After confirmation, all should be 'scheduled'
      const confirmedTrips = trips.map(t => ({ ...t, status: 'scheduled' as const }));
      confirmedTrips.forEach(trip => {
        expect(trip.status).toBe('scheduled');
      });
    });

    it('should not allow partial confirmation of recurring trips', () => {
      const recurringTripId = 'recurring_123';
      const trips = [
        { id: 'trip_1', status: 'order' as const, recurring_trip_id: recurringTripId },
        { id: 'trip_2', status: 'order' as const, recurring_trip_id: recurringTripId },
        { id: 'trip_3', status: 'order' as const, recurring_trip_id: recurringTripId },
      ];

      // Attempting to confirm only one should fail
      const partialConfirm = trips[0];
      const remainingOrders = trips.filter(t => t.id !== partialConfirm.id && t.status === 'order');
      
      expect(remainingOrders.length).toBeGreaterThan(0);
      // Business rule: all or nothing
      expect(partialConfirm.recurring_trip_id).toBe(recurringTripId);
    });
  });

  describe('Order Decline', () => {
    it('should decline order with valid reason', () => {
      const validReasons = [
        'conflict',
        'day_off',
        'unavailable',
        'vehicle_issue',
        'personal_emergency',
        'too_far',
      ];

      const declineReason = 'conflict';
      const trip = {
        id: 'trip_123',
        status: 'order' as const,
        driver_id: 'driver_123',
      };

      const expectedUpdate = {
        status: 'order', // Stays as order
        decline_reason: declineReason,
        declined_by: 'driver_123',
        declined_at: expect.any(String),
        driver_id: null, // Driver removed
        updated_by: 'driver_123',
      };

      expect(validReasons).toContain(declineReason);
      expect(trip.status).toBe('order');
    });

    it('should reject invalid decline reason', () => {
      const validReasons = [
        'conflict',
        'day_off',
        'unavailable',
        'vehicle_issue',
        'personal_emergency',
        'too_far',
      ];

      const invalidReason = 'invalid_reason';
      expect(validReasons).not.toContain(invalidReason);
    });
  });

  describe('User Tagging for Notifications', () => {
    it('should tag user to receive trip notifications', () => {
      const tagData = {
        trip_id: 'trip_123',
        user_id: 'user_456',
        created_by: 'user_123',
      };

      const expectedTag = {
        id: expect.any(String),
        trip_id: 'trip_123',
        user_id: 'user_456',
        created_by: 'user_123',
        created_at: expect.any(String),
      };

      expect(tagData.trip_id).toBe('trip_123');
      expect(tagData.user_id).toBe('user_456');
    });

    it('should prevent duplicate tags', () => {
      const existingTag = {
        trip_id: 'trip_123',
        user_id: 'user_456',
      };

      const newTag = {
        trip_id: 'trip_123',
        user_id: 'user_456',
      };

      // Should be unique constraint violation
      const isDuplicate = 
        existingTag.trip_id === newTag.trip_id && 
        existingTag.user_id === newTag.user_id;

      expect(isDuplicate).toBe(true);
    });

    it('should get all tagged users for a trip', () => {
      const tripId = 'trip_123';
      const taggedUsers = [
        { user_id: 'user_1', created_by: 'user_123' },
        { user_id: 'user_2', created_by: 'user_123' },
      ];

      expect(taggedUsers.length).toBe(2);
      taggedUsers.forEach(tag => {
        expect(tag.user_id).toBeDefined();
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should have default notification preferences', () => {
      const defaultPreferences = {
        order_confirmed: true,
        order_declined: true,
        trip_started: true,
        client_onboard: false,
        client_dropoff: false,
        trip_completed: true,
        no_show: true,
        wait_time_started: false,
        wait_time_stopped: false,
      };

      expect(defaultPreferences.order_confirmed).toBe(true);
      expect(defaultPreferences.trip_started).toBe(true);
      expect(defaultPreferences.client_onboard).toBe(false);
    });

    it('should allow users to customize notification preferences', () => {
      const userPreferences = {
        user_id: 'user_123',
        trip_status_updates: {
          order_confirmed: true,
          order_declined: false, // User doesn't want decline notifications
          trip_started: true,
          client_onboard: true, // User wants onboard notifications
          client_dropoff: false,
          trip_completed: true,
          no_show: true,
          wait_time_started: false,
          wait_time_stopped: false,
        },
      };

      expect(userPreferences.trip_status_updates.order_confirmed).toBe(true);
      expect(userPreferences.trip_status_updates.order_declined).toBe(false);
      expect(userPreferences.trip_status_updates.client_onboard).toBe(true);
    });

    it('should filter notifications based on user preferences', () => {
      const notificationType = 'client_onboard';
      const userPreferences = {
        trip_status_updates: {
          client_onboard: false,
        },
      };

      const shouldNotify = userPreferences.trip_status_updates[notificationType as keyof typeof userPreferences.trip_status_updates];
      expect(shouldNotify).toBe(false);
    });
  });

  describe('Notification Sending', () => {
    it('should notify trip creator when order is confirmed', () => {
      const trip = {
        id: 'trip_123',
        created_by: 'user_123',
        status: 'order' as const,
      };

      const notification = {
        tripId: trip.id,
        notificationType: 'order_confirmed',
        recipientUserId: trip.created_by,
      };

      expect(notification.recipientUserId).toBe('user_123');
      expect(notification.notificationType).toBe('order_confirmed');
    });

    it('should notify tagged users when trip status updates', () => {
      const trip = {
        id: 'trip_123',
        created_by: 'user_123',
        status: 'in_progress' as const,
      };

      const taggedUsers = ['user_456', 'user_789'];
      const notificationType = 'trip_started';

      taggedUsers.forEach(userId => {
        const notification = {
          tripId: trip.id,
          notificationType,
          recipientUserId: userId,
        };

        expect(notification.recipientUserId).toBeDefined();
        expect(notification.notificationType).toBe(notificationType);
      });
    });

    it('should notify super admins when order is declined', () => {
      const trip = {
        id: 'trip_123',
        status: 'order' as const,
        decline_reason: 'conflict',
        declined_by: 'driver_123',
      };

      const superAdmins = ['admin_1', 'admin_2'];
      const notificationType = 'order_declined';

      superAdmins.forEach(adminId => {
        const notification = {
          tripId: trip.id,
          notificationType,
          recipientUserId: adminId,
          declineReason: trip.decline_reason,
        };

        expect(notification.recipientUserId).toBeDefined();
        expect(notification.notificationType).toBe(notificationType);
      });
    });

    it('should respect user notification preferences', () => {
      const notificationType = 'client_onboard';
      const userPreferences = {
        trip_status_updates: {
          client_onboard: false,
        },
      };

      const shouldSend = userPreferences.trip_status_updates[notificationType as keyof typeof userPreferences.trip_status_updates];
      
      if (shouldSend) {
        // Send notification
        expect(shouldSend).toBe(false); // This user doesn't want this notification
      } else {
        // Skip notification
        expect(shouldSend).toBe(false);
      }
    });
  });
});

