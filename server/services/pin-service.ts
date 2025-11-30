/**
 * PIN Service
 * 
 * Handles 4-digit PIN hashing and verification
 * PINs are assigned by case managers during client creation
 */
import bcrypt from 'bcrypt';

class PINService {
  /**
   * Hash a 4-digit PIN using bcrypt
   */
  async hashPIN(pin: string): Promise<string> {
    if (!this.validatePIN(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }
    
    const saltRounds = 10;
    return await bcrypt.hash(pin, saltRounds);
  }

  /**
   * Verify PIN matches hash
   */
  async verifyPIN(hashedPin: string, pin: string): Promise<boolean> {
    if (!this.validatePIN(pin)) {
      return false;
    }
    
    try {
      return await bcrypt.compare(pin, hashedPin);
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  /**
   * Validate PIN format (must be exactly 4 digits)
   */
  validatePIN(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }
}

export const pinService = new PINService();

