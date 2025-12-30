/**
 * Address utility functions for parsing and formatting addresses
 */

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Parse a full address string into separated components
 * Handles formats like:
 * - "123 Main St, City, State ZIP"
 * - "123 Main St, City, State"
 * - "123 Main St, City"
 */
export function parseAddressString(address: string): AddressData {
  if (!address || typeof address !== 'string') {
    return { street: '', city: '', state: '', zip: '' };
  }

  const trimmed = address.trim();
  if (!trimmed) {
    return { street: '', city: '', state: '', zip: '' };
  }

  // Split by commas
  const parts = trimmed.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length >= 3) {
    // Format: "Street, City, State ZIP" or "Street, City, State"
    const street = parts[0];
    const city = parts[1];
    const stateZipPart = parts[2];
    
    // Try to split state and ZIP (e.g., "CO 80221" or just "CO")
    const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s*(\d{5})?$/i);
    if (stateZipMatch) {
      return {
        street,
        city,
        state: stateZipMatch[1].toUpperCase(),
        zip: stateZipMatch[2] || ''
      };
    } else {
      // If no match, assume it's just state (2 letters)
      const stateMatch = stateZipPart.match(/^([A-Z]{2})$/i);
      if (stateMatch) {
        return {
          street,
          city,
          state: stateMatch[1].toUpperCase(),
          zip: ''
        };
      } else {
        // Fallback: put everything in street
        return {
          street: trimmed,
          city: '',
          state: '',
          zip: ''
        };
      }
    }
  } else if (parts.length === 2) {
    // Format: "Street, City"
    return {
      street: parts[0],
      city: parts[1],
      state: '',
      zip: ''
    };
  } else {
    // Single part - assume it's just the street
    return {
      street: trimmed,
      city: '',
      state: '',
      zip: ''
    };
  }
}

/**
 * Format separated address components into a full address string
 */
export function formatFullAddress(address: AddressData): string {
  const parts = [
    address.street,
    address.city,
    address.state && address.zip ? `${address.state} ${address.zip}` : address.state || address.zip
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Check if an address string is valid (has at least street and city)
 */
export function isValidAddress(address: string | AddressData): boolean {
  if (typeof address === 'string') {
    const parsed = parseAddressString(address);
    return !!(parsed.street && parsed.city);
  }
  return !!(address.street && address.city);
}




