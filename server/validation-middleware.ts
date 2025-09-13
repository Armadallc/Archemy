// Snake_case enforcement system to prevent camelCase confusion

import { Request, Response, NextFunction } from 'express';

// Required snake_case fields that must not be accessed in camelCase
const REQUIRED_SNAKE_CASE_FIELDS = [
  'user_id', 'primary_organization_id', 'scheduled_pickup_time', 
  'driver_id', 'client_id', 'pickup_address', 'dropoff_address',
  'organization_id', 'service_area_id', 'license_number', 'vehicle_info',
  'emergency_contact', 'emergency_phone', 'is_active', 'is_available',
  'created_at', 'updated_at', 'first_name', 'last_name'
];

/**
 * Validates that all object keys are in snake_case format
 */
function validateSnakeCaseFields(obj: any, path: string = ''): string[] {
  const errors: string[] = [];
  
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if field name is snake_case
      if (!/^[a-z_][a-z0-9_]*$/.test(key)) {
        errors.push(`Invalid field name: "${currentPath}" - must be snake_case`);
      }
      
      // Check for common camelCase violations
      const camelCaseViolations = [
        'userId', 'primaryOrganizationId', 'scheduledPickupTime',
        'driverId', 'clientId', 'pickupAddress', 'dropoffAddress',
        'organizationId', 'serviceAreaId', 'licenseNumber', 'vehicleInfo',
        'emergencyContact', 'emergencyPhone', 'isActive', 'isAvailable',
        'createdAt', 'updatedAt', 'firstName', 'lastName'
      ];
      
      if (camelCaseViolations.includes(key)) {
        const snakeCase = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        errors.push(`CAMELCASE VIOLATION: "${currentPath}" should be "${snakeCase}"`);
      }
      
      // Recursively check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        errors.push(...validateSnakeCaseFields(obj[key], currentPath));
      }
    });
  }
  
  return errors;
}

/**
 * Middleware to validate API response format
 */
export function validateResponseFormat(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    try {
      let responseData = data;
      
      // Parse JSON if it's a string
      if (typeof data === 'string') {
        try {
          responseData = JSON.parse(data);
        } catch {
          // Not JSON, skip validation
          return originalSend.call(this, data);
        }
      }
      
      // Validate snake_case format
      const errors = validateSnakeCaseFields(responseData);
      
      if (errors.length > 0) {
        console.error(`API Response Format Errors on ${req.path}:`, errors);
        // In development, throw error. In production, log warning.
        if (process.env.NODE_ENV === 'development') {
          throw new Error(`Snake_case validation failed: ${errors.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.error('Response validation error:', error);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Validates database query results for snake_case compliance
 */
export function enforceSnakeCase<T>(queryResult: T, source: string = 'database'): T {
  if (!queryResult) return queryResult;
  
  const errors = validateSnakeCaseFields(queryResult);
  
  if (errors.length > 0) {
    console.error(`Snake_case violations in ${source}:`, errors);
    
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`SNAKE_CASE VIOLATION in ${source}: ${errors.join(', ')}`);
    }
  }
  
  return queryResult;
}

/**
 * Validates request body for snake_case compliance
 */
export function validateRequestFormat(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body && typeof req.body === 'object') {
      const errors = validateSnakeCaseFields(req.body);
      
      if (errors.length > 0) {
        console.error(`Request Format Errors on ${req.path}:`, errors);
        
        return res.status(400).json({
          error: 'Invalid field format',
          message: 'All field names must be in snake_case format',
          violations: errors
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Request validation error:', error);
    next();
  }
}