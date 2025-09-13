/**
 * Navigation utilities for generating deep links to maps applications
 */

export interface NavigationOptions {
  preferGoogleMaps?: boolean;
  travelMode?: 'driving' | 'walking' | 'transit';
}

/**
 * Generate Apple Maps deep link (works on iOS and as fallback on other platforms)
 */
export function generateAppleMapsLink(
  pickupAddress: string, 
  dropoffAddress: string, 
  options: NavigationOptions = {}
): string {
  const pickup = encodeURIComponent(pickupAddress.trim());
  const dropoff = encodeURIComponent(dropoffAddress.trim());
  
  // Apple Maps dirflg: d=driving, w=walking, r=transit
  const dirflg = options.travelMode === 'walking' ? 'w' : 
                 options.travelMode === 'transit' ? 'r' : 'd';
  
  return `https://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=${dirflg}`;
}

/**
 * Generate Google Maps deep link
 */
export function generateGoogleMapsLink(
  pickupAddress: string, 
  dropoffAddress: string, 
  options: NavigationOptions = {}
): string {
  const pickup = encodeURIComponent(pickupAddress.trim());
  const dropoff = encodeURIComponent(dropoffAddress.trim());
  
  const travelmode = options.travelMode || 'driving';
  
  return `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=${travelmode}`;
}

/**
 * Generate universal navigation link that works across platforms
 */
export function generateNavigationLink(
  pickupAddress: string, 
  dropoffAddress: string, 
  options: NavigationOptions = {}
): string {
  // Detect user agent for better platform detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  // Use Google Maps if explicitly requested or on Android
  if (options.preferGoogleMaps || isAndroid) {
    return generateGoogleMapsLink(pickupAddress, dropoffAddress, options);
  }
  
  // Default to Apple Maps (works as universal fallback)
  return generateAppleMapsLink(pickupAddress, dropoffAddress, options);
}

/**
 * Open navigation in device's default maps app
 */
export function openNavigation(
  pickupAddress: string, 
  dropoffAddress: string, 
  options: NavigationOptions = {}
): void {
  const link = generateNavigationLink(pickupAddress, dropoffAddress, options);
  window.open(link, '_blank');
}

/**
 * Validate if addresses are suitable for navigation
 */
export function validateAddressForNavigation(address: string): {
  isValid: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
} {
  const issues: string[] = [];
  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  
  if (!address || address.trim().length < 3) {
    return {
      isValid: false,
      quality: 'poor',
      issues: ['Address is empty or too short']
    };
  }
  
  const trimmed = address.trim();
  
  // Check for zip code
  const hasZipCode = /\d{5}(-\d{4})?/.test(trimmed);
  if (!hasZipCode) {
    issues.push('Missing zip code');
    quality = quality === 'excellent' ? 'good' : quality;
  }
  
  // Check for state
  const hasState = /\b[A-Z]{2}\b/.test(trimmed);
  if (!hasState) {
    issues.push('Missing state abbreviation');
    quality = quality === 'excellent' ? 'fair' : quality === 'good' ? 'fair' : quality;
  }
  
  // Check for city
  const hasCityPattern = /,\s*[A-Za-z\s]+,?\s*[A-Z]{2}/.test(trimmed);
  if (!hasCityPattern) {
    issues.push('Missing or unclear city name');
    quality = quality === 'excellent' ? 'fair' : quality === 'good' ? 'fair' : 'poor';
  }
  
  // Check for street number
  const hasStreetNumber = /^\d+/.test(trimmed);
  if (!hasStreetNumber) {
    issues.push('Missing street number');
    quality = quality === 'excellent' ? 'good' : quality;
  }
  
  return {
    isValid: true,
    quality,
    issues
  };
}