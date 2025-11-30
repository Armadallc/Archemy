/**
 * Client Verification Service
 * 
 * Verifies client information matches database records
 * Used during QR code signup to ensure only existing clients can opt-in
 */
import { supabase } from '../db';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  program_id: string;
  location_id?: string;
  phone?: string;
  email?: string;
  pin_hash?: string;
  is_active: boolean;
}

class ClientVerificationService {
  /**
   * Verify client information matches database
   * Returns matching client if found, null otherwise
   */
  async verifyClientInfo(
    programId: string,
    firstName: string,
    lastName: string,
    phoneNumber?: string,
    email?: string
  ): Promise<Client | null> {
    try {
      // Normalize input
      const normalizedFirstName = this.normalizeName(firstName);
      const normalizedLastName = this.normalizeName(lastName);
      const normalizedPhone = phoneNumber ? this.normalizePhone(phoneNumber) : null;
      const normalizedEmail = email ? this.normalizeEmail(email) : null;

      // Query clients in the program
      let query = supabase
        .from('clients')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .ilike('first_name', normalizedFirstName)
        .ilike('last_name', normalizedLastName);

      const { data: clients, error } = await query;

      if (error) {
        console.error('Error querying clients:', error);
        return null;
      }

      if (!clients || clients.length === 0) {
        return null;
      }

      // Find exact match (name + optional phone/email)
      for (const client of clients) {
        if (this.matchesClient(client, normalizedFirstName, normalizedLastName, normalizedPhone, normalizedEmail)) {
          return client as Client;
        }
      }

      return null;
    } catch (error) {
      console.error('Error verifying client info:', error);
      return null;
    }
  }

  /**
   * Find clients by search criteria
   */
  async findClientByInfo(
    programId: string,
    searchCriteria: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
    }
  ): Promise<Client[]> {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true);

      if (searchCriteria.firstName) {
        query = query.ilike('first_name', `%${this.normalizeName(searchCriteria.firstName)}%`);
      }
      if (searchCriteria.lastName) {
        query = query.ilike('last_name', `%${this.normalizeName(searchCriteria.lastName)}%`);
      }
      if (searchCriteria.phone) {
        query = query.eq('phone', this.normalizePhone(searchCriteria.phone));
      }
      if (searchCriteria.email) {
        query = query.ilike('email', this.normalizeEmail(searchCriteria.email));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error finding clients:', error);
        return [];
      }

      return (data || []) as Client[];
    } catch (error) {
      console.error('Error finding clients:', error);
      return [];
    }
  }

  /**
   * Check if client matches search criteria
   */
  matchesClient(
    client: Client,
    firstName: string,
    lastName: string,
    phone?: string | null,
    email?: string | null
  ): boolean {
    // Must match first name and last name (case-insensitive)
    const clientFirstName = this.normalizeName(client.first_name);
    const clientLastName = this.normalizeName(client.last_name);

    if (clientFirstName !== firstName || clientLastName !== lastName) {
      return false;
    }

    // Optional: match phone or email if provided
    if (phone) {
      const clientPhone = client.phone ? this.normalizePhone(client.phone) : null;
      if (clientPhone && clientPhone === phone) {
        return true;
      }
    }

    if (email) {
      const clientEmail = client.email ? this.normalizeEmail(client.email) : null;
      if (clientEmail && clientEmail === email) {
        return true;
      }
    }

    // If no phone/email provided, match on name alone
    if (!phone && !email) {
      return true;
    }

    // If phone/email provided but doesn't match, return false
    return false;
  }

  /**
   * Normalize name (trim, lowercase, remove extra spaces)
   */
  normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Normalize phone number (remove non-digits, keep only digits)
   */
  normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Normalize email (trim, lowercase)
   */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Validate PIN format (must be exactly 4 digits)
   */
  validatePIN(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }
}

export const clientVerificationService = new ClientVerificationService();

