/**
 * Trip Status Transition Validator
 * 
 * Validates that trip status transitions follow the proper workflow:
 * - scheduled → confirmed, in_progress, cancelled, no_show
 * - confirmed → in_progress, cancelled, no_show
 * - in_progress → completed, cancelled
 * - completed → (no transitions allowed)
 * - cancelled → (no transitions allowed)
 * - no_show → (no transitions allowed)
 */

export type TripStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface StatusTransition {
  from: TripStatus;
  to: TripStatus;
  isValid: boolean;
  reason?: string;
}

/**
 * Valid status transitions map
 * Key: current status, Value: array of allowed next statuses
 */
const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  scheduled: ['confirmed', 'in_progress', 'cancelled', 'no_show'], // Allow direct start from scheduled
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state - no transitions
  cancelled: [], // Terminal state - no transitions
  no_show: []    // Terminal state - no transitions
};

/**
 * Validates if a status transition is allowed
 * @param currentStatus - The current trip status
 * @param newStatus - The desired new status
 * @returns StatusTransition object with isValid flag and reason
 */
export function validateStatusTransition(
  currentStatus: TripStatus,
  newStatus: TripStatus
): StatusTransition {
  // Same status is always valid (idempotent)
  if (currentStatus === newStatus) {
    return {
      from: currentStatus,
      to: newStatus,
      isValid: true,
      reason: 'Status unchanged'
    };
  }

  // Check if transition is in the allowed list
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions) {
    return {
      from: currentStatus,
      to: newStatus,
      isValid: false,
      reason: `Unknown current status: ${currentStatus}`
    };
  }

  const isValid = allowedTransitions.includes(newStatus);

  if (!isValid) {
    return {
      from: currentStatus,
      to: newStatus,
      isValid: false,
      reason: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.join(', ')}`
    };
  }

  return {
    from: currentStatus,
    to: newStatus,
    isValid: true,
    reason: `Valid transition: ${currentStatus} → ${newStatus}`
  };
}

/**
 * Gets the list of valid next statuses for a given current status
 * @param currentStatus - The current trip status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: TripStatus): TripStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Checks if a status is a terminal state (no further transitions allowed)
 * @param status - The status to check
 * @returns true if status is terminal
 */
export function isTerminalStatus(status: TripStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/**
 * Determines which timestamp should be set based on status change
 * @param previousStatus - Previous status
 * @param newStatus - New status
 * @returns Object indicating which timestamps should be set
 */
export function getTimestampForStatusChange(
  previousStatus: TripStatus,
  newStatus: TripStatus
): {
  shouldSetPickupTime: boolean;
  shouldSetDropoffTime: boolean;
  shouldSetReturnTime: boolean;
} {
  const result = {
    shouldSetPickupTime: false,
    shouldSetDropoffTime: false,
    shouldSetReturnTime: false
  };

  // Set pickup time when transitioning to in_progress
  if (newStatus === 'in_progress' && previousStatus !== 'in_progress') {
    result.shouldSetPickupTime = true;
  }

  // Set dropoff time when transitioning to completed
  if (newStatus === 'completed' && previousStatus !== 'completed') {
    result.shouldSetDropoffTime = true;
    // If it's a round trip and we just completed, we might also need return time
    // This will be handled by the caller based on trip_type
  }

  return result;
}

