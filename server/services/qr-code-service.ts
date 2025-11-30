/**
 * QR Code Service
 * 
 * Generates and manages QR codes for programs (one per program)
 * QR codes link to public signup page where clients can opt-in for notifications
 */
import { supabase } from '../db';
import QRCode from 'qrcode';
import crypto from 'node:crypto';

export interface ProgramQRCode {
  id: string;
  program_id: string;
  qr_token: string;
  qr_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class QRCodeService {
  /**
   * Generate or get existing QR code for a program
   */
  async getOrGenerateQRCode(programId: string): Promise<{ token: string; qrImageUrl: string; signupUrl: string }> {
    try {
      // Check if active QR code exists
      const { data: existing, error: fetchError } = await supabase
        .from('program_qr_codes')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .single();

      if (existing && !fetchError) {
        // Return existing QR code
        const signupUrl = this.getSignupUrl(existing.qr_token);
        return {
          token: existing.qr_token,
          qrImageUrl: existing.qr_image_url || await this.generateQRImage(existing.qr_token),
          signupUrl
        };
      }

      // Generate new QR code
      return await this.generateQRCode(programId);
    } catch (error) {
      console.error('Error getting/generating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate new QR code for a program
   */
  async generateQRCode(programId: string): Promise<{ token: string; qrImageUrl: string; signupUrl: string }> {
    try {
      // Generate secure token (64 chars)
      const token = this.generateSecureToken();

      // Generate QR code image
      const signupUrl = this.getSignupUrl(token);
      const qrImageUrl = await this.generateQRImage(token);

      // Deactivate any existing QR codes for this program
      await supabase
        .from('program_qr_codes')
        .update({ is_active: false })
        .eq('program_id', programId)
        .eq('is_active', true);

      // Create new QR code record
      const qrCodeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabase
        .from('program_qr_codes')
        .insert({
          id: qrCodeId,
          program_id: programId,
          qr_token: token,
          qr_image_url: qrImageUrl,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        token: data.qr_token,
        qrImageUrl: data.qr_image_url || qrImageUrl,
        signupUrl
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Get QR code by token (for public verification page)
   */
  async getQRCodeByToken(token: string): Promise<ProgramQRCode | null> {
    try {
      const { data, error } = await supabase
        .from('program_qr_codes')
        .select('*')
        .eq('qr_token', token)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error('Error getting QR code by token:', error);
      return null;
    }
  }

  /**
   * Get QR code by program ID
   */
  async getQRCodeByProgram(programId: string): Promise<ProgramQRCode | null> {
    try {
      const { data, error } = await supabase
        .from('program_qr_codes')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error('Error getting QR code by program:', error);
      return null;
    }
  }

  /**
   * Regenerate QR code for a program (invalidate old, create new)
   */
  async regenerateQRCode(programId: string): Promise<{ token: string; qrImageUrl: string; signupUrl: string }> {
    return await this.generateQRCode(programId);
  }

  /**
   * Invalidate QR code (deactivate)
   */
  async invalidateQRCode(programId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('program_qr_codes')
        .update({ is_active: false })
        .eq('program_id', programId)
        .eq('is_active', true);

      if (error) throw error;
    } catch (error) {
      console.error('Error invalidating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate secure token (64 characters)
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate QR code image (data URL)
   */
  private async generateQRImage(token: string): Promise<string> {
    try {
      const signupUrl = this.getSignupUrl(token);
      const qrDataUrl = await QRCode.toDataURL(signupUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR image:', error);
      throw error;
    }
  }

  /**
   * Get signup URL for token
   */
  private getSignupUrl(token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/public/qr-verify/${token}`;
  }
}

export const qrCodeService = new QRCodeService();

