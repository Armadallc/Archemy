/**
 * Client Notifications API Routes
 * 
 * Handles QR code generation, client verification, and push subscription management
 */
import express from 'express';
import { qrCodeService } from '../services/qr-code-service';
import { clientVerificationService } from '../services/client-verification-service';
import { pinService } from '../services/pin-service';
import { clientNotificationUserService } from '../services/client-notification-user-service';
import { requireSupabaseAuth, requireSupabaseRole, SupabaseAuthenticatedRequest } from '../supabase-auth';
import { PERMISSIONS, requirePermission } from '../permissions';
import { supabase } from '../db';

const router = express.Router();

// ============================================================================
// ADMIN ROUTES (QR Code Management)
// ============================================================================

/**
 * GET /api/programs/:programId/qr-code
 * Get or generate QR code for a program (admin only)
 */
router.get(
  '/programs/:programId/qr-code',
  requireSupabaseAuth,
  requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']),
  async (req: SupabaseAuthenticatedRequest, res) => {
    try {
      const { programId } = req.params;

      const result = await qrCodeService.getOrGenerateQRCode(programId);

      res.json({
        success: true,
        data: {
          token: result.token,
          qrImageUrl: result.qrImageUrl,
          signupUrl: result.signupUrl,
          programId
        }
      });
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get QR code',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/programs/:programId/qr-code/regenerate
 * Regenerate QR code for a program (admin only)
 */
router.post(
  '/programs/:programId/qr-code/regenerate',
  requireSupabaseAuth,
  requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']),
  async (req: SupabaseAuthenticatedRequest, res) => {
    try {
      const { programId } = req.params;

      const result = await qrCodeService.regenerateQRCode(programId);

      res.json({
        success: true,
        data: {
          token: result.token,
          qrImageUrl: result.qrImageUrl,
          signupUrl: result.signupUrl,
          programId
        }
      });
    } catch (error: any) {
      console.error('Error regenerating QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate QR code',
        error: error.message
      });
    }
  }
);

// ============================================================================
// PUBLIC ROUTES (Client Verification & Opt-in)
// ============================================================================

/**
 * GET /api/public/qr/:token
 * Get program info from QR token (public, no auth required)
 */
router.get('/public/qr/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const qrCode = await qrCodeService.getQRCodeByToken(token);
    if (!qrCode || !qrCode.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired QR code'
      });
    }

    // Get program info
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('id', qrCode.program_id)
      .single();

    if (programError || !program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    res.json({
      success: true,
      data: {
        programId: program.id,
        programName: program.name,
        token: token
      }
    });
  } catch (error: any) {
    console.error('Error getting QR info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get QR code info',
      error: error.message
    });
  }
});

/**
 * POST /api/public/qr/verify
 * Verify client information and PIN, then opt-in for notifications (public, no auth required)
 */
router.post('/public/qr/verify', async (req, res) => {
  try {
    const { token, firstName, lastName, phoneNumber, email, pin, pushEnabled } = req.body;

    // Validate required fields
    if (!token || !firstName || !lastName || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: token, firstName, lastName, pin'
      });
    }

    // Validate PIN format
    if (!pinService.validatePIN(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits'
      });
    }

    // Get QR code and program info
    const qrCode = await qrCodeService.getQRCodeByToken(token);
    if (!qrCode || !qrCode.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired QR code'
      });
    }

    const programId = qrCode.program_id;

    // Verify client information
    const client = await clientVerificationService.verifyClientInfo(
      programId,
      firstName,
      lastName,
      phoneNumber,
      email
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'No matching client found. Please contact your case manager.'
      });
    }

    // Verify PIN
    if (!client.pin_hash) {
      return res.status(400).json({
        success: false,
        message: 'Client PIN not set. Please contact your case manager.'
      });
    }

    const pinValid = await pinService.verifyPIN(client.pin_hash, pin);
    if (!pinValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN. Please check with your case manager.'
      });
    }

    // Check if already opted in
    const { data: existingOptIn } = await supabase
      .from('client_opt_ins')
      .select('*')
      .eq('client_id', client.id)
      .eq('program_id', programId)
      .eq('is_active', true)
      .single();

    let userId: string;

    if (existingOptIn && existingOptIn.user_id) {
      // Use existing notification user
      userId = existingOptIn.user_id;
    } else {
      // Create notification user
      const notificationUser = await clientNotificationUserService.createNotificationUser(
        client.id,
        `${client.first_name} ${client.last_name}`,
        client.email
      );
      userId = notificationUser.user_id;

      // Create opt-in record
      const optInId = `opt_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await supabase
        .from('client_opt_ins')
        .insert({
          id: optInId,
          client_id: client.id,
          program_id: programId,
          user_id: userId,
          verified_at: new Date().toISOString(),
          opt_in_method: 'qr_code',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Enable push notifications for client
      await supabase
        .from('clients')
        .update({ push_notifications_enabled: true })
        .eq('id', client.id);
    }

    res.json({
      success: true,
      data: {
        verified: true,
        clientId: client.id,
        userId: userId,
        pushSetupRequired: pushEnabled !== false // Default to true if not specified
      }
    });
  } catch (error: any) {
    console.error('Error verifying client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify client',
      error: error.message
    });
  }
});

// ============================================================================
// PUSH SUBSCRIPTION ROUTES
// ============================================================================

/**
 * POST /api/client-notifications/subscribe
 * Save push subscription for notification user (public, but requires valid userId)
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;

    if (!userId || !subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, subscription (with endpoint)'
      });
    }

    // Verify user exists and is notification-only
    const user = await clientNotificationUserService.getNotificationUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Notification user not found'
      });
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          user_agent: req.headers['user-agent'] || null,
          device_info: {
            browser: req.headers['user-agent'],
            platform: req.headers['sec-ch-ua-platform'] || null
          },
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      return res.json({
        success: true,
        data: { subscriptionId: existing.id, message: 'Subscription updated' }
      });
    }

    // Create new subscription
    const subscriptionId = `push_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newSubscription, error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        id: subscriptionId,
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: req.headers['user-agent'] || null,
        device_info: {
          browser: req.headers['user-agent'],
          platform: req.headers['sec-ch-ua-platform'] || null
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({
      success: true,
      data: { subscriptionId: newSubscription.id, message: 'Subscription saved' }
    });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push subscription',
      error: error.message
    });
  }
});

/**
 * DELETE /api/client-notifications/subscribe/:subscriptionId
 * Unsubscribe from push notifications
 */
router.delete('/subscribe/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe',
      error: error.message
    });
  }
});

/**
 * GET /api/client-notifications/vapid-public-key
 * Get VAPID public key for frontend subscription (public, no auth required)
 */
router.get('/vapid-public-key', async (req, res) => {
  try {
    const { vapidKeysService } = await import('../services/vapid-keys');
    const publicKey = vapidKeysService.getPublicKey();

    res.json({
      success: true,
      data: { publicKey }
    });
  } catch (error: any) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      message: 'VAPID keys not configured',
      error: error.message
    });
  }
});

export default router;

