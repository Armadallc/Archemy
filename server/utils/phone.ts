/**
 * Phone number formatting utility
 * Normalizes phone numbers to E.164 format (+1XXXXXXXXXX for US numbers)
 */
export function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different input formats
  if (digits.length === 10) {
    // US number without country code: 7208502395 -> +17208502395
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code but no +: 17208502395 -> +17208502395
    return `+${digits}`;
  } else if (digits.length > 10) {
    // International number - just add + if not present
    return `+${digits}`;
  }
  
  // Return as-is if we can't format it (too short)
  return phone;
}



