/**
 * Client Notification User Service
 * 
 * Creates and manages notification-only users for clients
 * These users can receive push notifications but cannot log into the app
 */
import { supabase } from '../db';

export interface NotificationUser {
  user_id: string;
  user_name: string;
  email: string;
  password_hash: string;
  role: 'client_user';
  client_id: string;
  is_notification_only: boolean;
  is_active: boolean;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

class ClientNotificationUserService {
  /**
   * Create notification-only user for client
   */
  async createNotificationUser(clientId: string, clientName: string, clientEmail?: string): Promise<NotificationUser> {
    try {
      // Check if notification user already exists for this client
      const existing = await this.getNotificationUserByClientId(clientId);
      if (existing) {
        return existing;
      }

      // Get client info
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        throw new Error('Client not found');
      }

      // Generate user ID (max 50 chars, so truncate UUID if needed)
      const shortClientId = clientId.replace(/-/g, '').substring(0, 30);
      const userId = `client_${shortClientId}`;

      // Generate email (use client email if available, otherwise generate placeholder)
      const email = clientEmail || client.email || `client_${clientId}@notifications.local`;

      // Generate dummy password hash (not used for login, but required by schema)
      const bcryptModule = await import('bcrypt');
      const bcrypt = bcryptModule.default || bcryptModule;
      const dummyPassword = await bcrypt.hash(`dummy_${Date.now()}`, 10);

      // Create notification user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          user_name: `${client.first_name} ${client.last_name}`,
          email: email,
          password_hash: dummyPassword,
          role: 'client_user',
          client_id: clientId,
          is_notification_only: true,
          is_active: true,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating notification user:', userError);
        throw userError;
      }

      // Link client to notification user
      await this.linkClientToUser(clientId, userId);

      return user as NotificationUser;
    } catch (error) {
      console.error('Error creating notification user:', error);
      throw error;
    }
  }

  /**
   * Get notification user by client ID
   */
  async getNotificationUserByClientId(clientId: string): Promise<NotificationUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_notification_only', true)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return data as NotificationUser;
    } catch (error) {
      console.error('Error getting notification user:', error);
      return null;
    }
  }

  /**
   * Link client to notification user
   */
  async linkClientToUser(clientId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ notification_user_id: userId })
        .eq('id', clientId);

      if (error) {
        console.error('Error linking client to user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error linking client to user:', error);
      throw error;
    }
  }

  /**
   * Get notification user by user ID
   */
  async getNotificationUser(userId: string): Promise<NotificationUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_notification_only', true)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return data as NotificationUser;
    } catch (error) {
      console.error('Error getting notification user:', error);
      return null;
    }
  }
}

export const clientNotificationUserService = new ClientNotificationUserService();

