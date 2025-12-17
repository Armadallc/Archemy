/**
 * Utility functions for handling PostgreSQL constraint violations
 * Provides user-friendly error messages for database constraint errors
 */

export interface ConstraintError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

/**
 * Detects if an error is a PostgreSQL constraint violation
 */
export function isConstraintError(error: any): boolean {
  if (!error) return false;
  
  // PostgreSQL error codes for constraints
  const constraintCodes = [
    '23502', // NOT NULL violation
    '23503', // Foreign key violation
    '23505', // Unique constraint violation
    '23514', // Check constraint violation
  ];
  
  return constraintCodes.includes(error.code) || 
         error.message?.includes('constraint') ||
         error.message?.includes('duplicate key') ||
         error.message?.includes('violates not-null constraint');
}

/**
 * Gets a user-friendly error message for constraint violations
 */
export function getConstraintErrorMessage(error: any): { message: string; statusCode: number } {
  if (!error) {
    return { message: 'Unknown error', statusCode: 500 };
  }

  const code = error.code;
  const details = error.details || '';
  const message = error.message || '';

  // NOT NULL constraint violation
  if (code === '23502') {
    const columnMatch = details.match(/column "(\w+)"/);
    const column = columnMatch ? columnMatch[1] : 'field';
    return {
      message: `${column} is required and cannot be empty`,
      statusCode: 400
    };
  }

  // Unique constraint violation
  if (code === '23505') {
    // Check for specific constraint names to provide better messages
    if (details.includes('uq_corporate_clients_code') || message.includes('corporate_clients_code')) {
      return {
        message: 'A corporate client with this code already exists. Please use a different code.',
        statusCode: 409
      };
    }
    
    if (details.includes('uq_programs_code') || message.includes('programs_code')) {
      return {
        message: 'A program with this code already exists. Program codes must be globally unique.',
        statusCode: 409
      };
    }
    
    if (details.includes('uq_location_program_code') || message.includes('location_program_code')) {
      return {
        message: 'A location with this code already exists in this program. Please use a different code.',
        statusCode: 409
      };
    }
    
    // Generic unique constraint violation
    return {
      message: 'This value already exists and must be unique.',
      statusCode: 409
    };
  }

  // Check constraint violation
  if (code === '23514') {
    if (details.includes('chk_corporate_client_code_format') || message.includes('corporate_client_code_format')) {
      return {
        message: 'Corporate client code must be 2-5 uppercase letters (e.g., MON, APN).',
        statusCode: 400
      };
    }
    
    if (details.includes('chk_program_code_format') || message.includes('program_code_format')) {
      return {
        message: 'Program code must be 2-4 uppercase letters (e.g., MC, ABC).',
        statusCode: 400
      };
    }
    
    if (details.includes('chk_location_code_format') || message.includes('location_code_format')) {
      return {
        message: 'Location code must be 2-5 uppercase letters (e.g., LOW, ABCDE).',
        statusCode: 400
      };
    }
    
    // Generic check constraint violation
    return {
      message: 'The provided value does not meet the required format.',
      statusCode: 400
    };
  }

  // Foreign key violation
  if (code === '23503') {
    return {
      message: 'Referenced record does not exist. Please check your selection.',
      statusCode: 400
    };
  }

  // Default: return original error
  return {
    message: message || 'Database constraint violation',
    statusCode: 400
  };
}

/**
 * Handles constraint errors and returns appropriate HTTP response
 * Use this in catch blocks to provide user-friendly error messages
 */
export function handleConstraintError(error: any, res: any): boolean {
  if (isConstraintError(error)) {
    const { message, statusCode } = getConstraintErrorMessage(error);
    res.status(statusCode).json({
      message,
      error: error.code || 'CONSTRAINT_VIOLATION',
      details: process.env.NODE_ENV === 'development' ? error.details : undefined
    });
    return true; // Error was handled
  }
  return false; // Error was not a constraint error
}
