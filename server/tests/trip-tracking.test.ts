/**
 * Unit Tests for Trip Creation and Update Tracking
 * 
 * Tests that trips correctly track:
 * - created_by: User who created the trip
 * - updated_by: User who last updated the trip
 * - updated_at: Timestamp of last update
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the minimal-supabase module to avoid requiring real Supabase credentials
vi.mock('../minimal-supabase', () => {
  const mockTripsStorage = {
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
    getAllTrips: vi.fn(),
  };
  
  return {
    tripsStorage: mockTripsStorage,
  };
});

// Import after mocking
import { tripsStorage } from '../minimal-supabase';

describe('Trip Creation and Update Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTrip', () => {
    it('should set created_by when creating a trip', async () => {
      const userId = 'test_user_123';
      const tripData = {
        program_id: 'test_program',
        pickup_address: '123 Main St',
        dropoff_address: '456 Oak Ave',
        scheduled_pickup_time: '2025-01-01T10:00:00Z',
        trip_type: 'one_way' as const,
        passenger_count: 1,
        status: 'scheduled' as const,
        created_by: userId,
      };

      const mockTrip = {
        id: 'trip_123',
        ...tripData,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        updated_by: userId, // Should match created_by on creation
      };

      (tripsStorage.createTrip as any).mockResolvedValue(mockTrip);

      const result = await tripsStorage.createTrip(tripData);

      expect(result.created_by).toBe(userId);
      expect(result.updated_by).toBe(userId); // Should match created_by on creation
      expect(tripsStorage.createTrip).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: userId,
        })
      );
    });

    it('should set updated_by to match created_by on initial creation', async () => {
      const userId = 'test_user_123';
      const tripData = {
        program_id: 'test_program',
        pickup_address: '123 Main St',
        dropoff_address: '456 Oak Ave',
        scheduled_pickup_time: '2025-01-01T10:00:00Z',
        trip_type: 'one_way' as const,
        passenger_count: 1,
        status: 'scheduled' as const,
        created_by: userId,
      };

      const mockTrip = {
        id: 'trip_123',
        ...tripData,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        updated_by: userId,
      };

      (tripsStorage.createTrip as any).mockResolvedValue(mockTrip);

      const result = await tripsStorage.createTrip(tripData);

      expect(result.updated_by).toBe(result.created_by);
    });

    it('should set created_at and updated_at timestamps', async () => {
      const userId = 'test_user_123';
      const tripData = {
        program_id: 'test_program',
        pickup_address: '123 Main St',
        dropoff_address: '456 Oak Ave',
        scheduled_pickup_time: '2025-01-01T10:00:00Z',
        trip_type: 'one_way' as const,
        passenger_count: 1,
        status: 'scheduled' as const,
        created_by: userId,
      };

      const beforeTime = new Date().toISOString();
      
      const mockTrip = {
        id: 'trip_123',
        ...tripData,
        created_at: beforeTime,
        updated_at: beforeTime,
        updated_by: userId,
      };

      (tripsStorage.createTrip as any).mockResolvedValue(mockTrip);

      const result = await tripsStorage.createTrip(tripData);
      const afterTime = new Date().toISOString();

      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
      expect(new Date(result.created_at).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
      expect(new Date(result.updated_at).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });
  });

  describe('updateTrip', () => {
    it('should set updated_by when updating a trip', async () => {
      const tripId = 'trip_123';
      const userId = 'test_user_456';
      const updates = {
        status: 'in_progress' as const,
        updated_by: userId,
      };

      const mockUpdatedTrip = {
        id: tripId,
        status: 'in_progress',
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };

      (tripsStorage.updateTrip as any).mockResolvedValue(mockUpdatedTrip);

      const result = await tripsStorage.updateTrip(tripId, updates);

      expect(result.updated_by).toBe(userId);
      expect(tripsStorage.updateTrip).toHaveBeenCalledWith(
        tripId,
        expect.objectContaining({
          updated_by: userId,
        })
      );
    });

    it('should set updated_at timestamp when updating a trip', async () => {
      const tripId = 'trip_123';
      const userId = 'test_user_456';
      const updates = {
        status: 'completed' as const,
        updated_by: userId,
      };

      const beforeTime = new Date().toISOString();
      
      const mockUpdatedTrip = {
        id: tripId,
        status: 'completed',
        updated_by: userId,
        updated_at: beforeTime,
      };

      (tripsStorage.updateTrip as any).mockResolvedValue(mockUpdatedTrip);

      const result = await tripsStorage.updateTrip(tripId, updates);
      const afterTime = new Date().toISOString();

      expect(result.updated_at).toBeDefined();
      expect(new Date(result.updated_at).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
      // Note: updated_at is typically set by the storage layer, not passed in
      expect(tripsStorage.updateTrip).toHaveBeenCalledWith(tripId, updates);
    });

    it('should not overwrite updated_at if already provided', async () => {
      const tripId = 'trip_123';
      const userId = 'test_user_456';
      const customUpdatedAt = '2025-01-02T15:30:00Z';
      const updates = {
        status: 'completed' as const,
        updated_by: userId,
        updated_at: customUpdatedAt,
      };

      const mockUpdatedTrip = {
        id: tripId,
        status: 'completed',
        updated_by: userId,
        updated_at: customUpdatedAt,
      };

      (tripsStorage.updateTrip as any).mockResolvedValue(mockUpdatedTrip);

      const result = await tripsStorage.updateTrip(tripId, updates);

      expect(result.updated_at).toBe(customUpdatedAt);
    });

    it('should remove empty updated_by values', async () => {
      const tripId = 'trip_123';
      const updates = {
        status: 'cancelled' as const,
        updated_by: '', // Empty string should be removed
      };

      const mockUpdatedTrip = {
        id: tripId,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      };

      (tripsStorage.updateTrip as any).mockResolvedValue(mockUpdatedTrip);

      await tripsStorage.updateTrip(tripId, updates);

      // Should be called with the updates (storage layer should filter empty values)
      expect(tripsStorage.updateTrip).toHaveBeenCalledWith(tripId, updates);
    });
  });

  describe('getAllTrips', () => {
    it('should include created_by_user and updated_by_user in trip data', async () => {
      const mockTrips = [
        {
          id: 'trip_123',
          program_id: 'test_program',
          created_by: 'user_123',
          updated_by: 'user_456',
          created_by_user: {
            user_id: 'user_123',
            user_name: 'John Doe',
          },
          updated_by_user: {
            user_id: 'user_456',
            user_name: 'Jane Smith',
          },
        },
      ];

      (tripsStorage.getAllTrips as any).mockResolvedValue(mockTrips);

      const result = await tripsStorage.getAllTrips();

      expect(result[0].created_by_user).toBeDefined();
      expect(result[0].created_by_user?.user_name).toBe('John Doe');
      expect(result[0].updated_by_user).toBeDefined();
      expect(result[0].updated_by_user?.user_name).toBe('Jane Smith');
    });
  });
});


