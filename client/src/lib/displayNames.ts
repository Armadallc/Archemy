/**
 * Utility functions for displaying user and driver names
 */

export interface User {
  user_id: string;
  user_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
}

export interface Driver {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  license_number: string;
  program_id: string;
}

/**
 * Get the best display name for a user
 * Priority: first_name + last_name > user_name
 */
export function getUserDisplayName(user: User): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.user_name;
}

/**
 * Get the best display name for a driver
 * Priority: driver professional name > user first_name + last_name > user_name
 */
export function getDriverDisplayName(user: User, driver?: Driver): string {
  // Priority 1: Driver professional name
  if (driver?.first_name && driver?.last_name) {
    return `${driver.first_name} ${driver.last_name}`;
  }
  
  // Priority 2: User first_name + last_name
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  // Priority 3: Username (fallback)
  return user.user_name;
}

/**
 * Get display name for trip driver
 * Handles the nested structure from API responses
 */
export function getTripDriverDisplayName(trip: any): string {
  if (!trip.drivers?.users) {
    return 'Unknown Driver';
  }

  const user = trip.drivers.users;
  const driver = trip.drivers;
  
  return getDriverDisplayName(user, driver);
}

/**
 * Format username for display (capitalize, add spaces)
 */
export function formatUsername(username: string): string {
  return username
    .replace(/[._-]/g, ' ')  // Replace separators with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


