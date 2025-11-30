/**
 * VAPID Keys Service
 * 
 * Manages VAPID (Voluntary Application Server Identification) keys for web push notifications
 * VAPID keys are used to identify the server sending push notifications
 */
import webpush from 'web-push';

export interface VAPIDKeys {
  publicKey: string;
  privateKey: string;
  subject: string; // Usually a mailto: URL
}

class VAPIDKeysService {
  private publicKey: string | null = null;
  private privateKey: string | null = null;
  private subject: string;

  constructor() {
    // Load VAPID keys from environment variables
    this.publicKey = process.env.VAPID_PUBLIC_KEY || null;
    this.privateKey = process.env.VAPID_PRIVATE_KEY || null;
    this.subject = process.env.VAPID_SUBJECT || 'mailto:admin@halcyon.com';

    // Set VAPID details for web-push library
    if (this.publicKey && this.privateKey) {
      webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);
    }
  }

  /**
   * Generate new VAPID key pair
   * Call this once to generate keys, then store them in environment variables
   */
  generateKeys(): VAPIDKeys {
    const vapidKeys = webpush.generateVAPIDKeys();
    return {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      subject: this.subject
    };
  }

  /**
   * Get public key (for frontend to subscribe)
   */
  getPublicKey(): string {
    if (!this.publicKey) {
      throw new Error('VAPID_PUBLIC_KEY not set in environment variables. Please generate keys and add them to .env');
    }
    return this.publicKey;
  }

  /**
   * Get private key (for sending push notifications)
   */
  getPrivateKey(): string {
    if (!this.privateKey) {
      throw new Error('VAPID_PRIVATE_KEY not set in environment variables. Please generate keys and add them to .env');
    }
    return this.privateKey;
  }

  /**
   * Check if VAPID keys are configured
   */
  isConfigured(): boolean {
    return !!(this.publicKey && this.privateKey);
  }

  /**
   * Initialize VAPID details (call this on server startup)
   */
  initialize(): void {
    if (this.publicKey && this.privateKey) {
      webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);
      console.log('✅ VAPID keys initialized');
    } else {
      console.warn('⚠️ VAPID keys not configured. Web push notifications will not work.');
      console.warn('   Run: npm run generate-vapid-keys (or use the generateKeys() method)');
    }
  }
}

export const vapidKeysService = new VAPIDKeysService();

// Initialize on module load
vapidKeysService.initialize();

