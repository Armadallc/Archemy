/**
 * Minimal Color System - Component Index
 * 
 * This file exports all minimal-color replacement components.
 * These components replace color-coded badges and indicators with
 * text labels, icons, meters, and typography variations.
 * 
 * Design Principle: Use color sparingly. Let typography, layout, and
 * visual hierarchy do the work. Reserve coral accent (primary) for
 * truly urgent/attention-required states only.
 * 
 * Fire Palette (6 core colors):
 * - charcoal (#26282b) - dark backgrounds, light mode text
 * - ice (#e8fffe) - light accent backgrounds  
 * - lime (#f1fec9) - elevated surfaces, accent
 * - coral (#ff555d) - primary actions, urgent states
 * - silver (#eaeaea) - borders, muted backgrounds
 * - cloud (#f4f4f4) - light mode background
 * 
 * @example
 * import { StatusBadge, TripProgressMeter, PriorityIndicator } from '@/components/ui/minimal-color-system';
 * 
 * // Status indicators
 * <StatusBadge status="success" />
 * <StatusBadge status="attention" label="NEEDS REVIEW" />
 * 
 * // Trip progress
 * <TripProgressMeter status="in_progress" />
 * <TripProgressMeter status="completed" />
 * 
 * // Priority levels
 * <PriorityIndicator level="high" label="Critical bug" />
 * <PriorityIndicator level="urgent" label="Server down" showIcon />
 */

// Status components
export { 
  StatusBadge, 
  StatusIcon,
  type StatusType 
} from './status-badge';

// Trip progress components
export { 
  TripProgressMeter, 
  TripStatusInline, 
  TripProgressBar,
  type TripStatus 
} from './trip-progress-meter';

// Priority components
export { 
  PriorityIndicator, 
  PriorityBadge, 
  PriorityText,
  type PriorityLevel 
} from './priority-indicator';

/**
 * Usage Guidelines:
 * 
 * 1. Status Indicators:
 *    - Use StatusBadge for most status displays
 *    - Use StatusIcon for compact inline status
 *    - Only use "attention" status for items requiring immediate action
 * 
 * 2. Trip Progress:
 *    - Use TripProgressMeter for detailed trip status with meter
 *    - Use TripStatusInline for compact inline display (icon + text)
 *    - Use TripProgressBar for meter-only displays
 * 
 * 3. Priority:
 *    - ALWAYS use list order as primary priority indicator (high at top)
 *    - Use PriorityIndicator for secondary visual reinforcement
 *    - Use PriorityBadge for compact badge-style display
 *    - Use PriorityText for inline text-only display
 *    - Only use "urgent" level for true emergencies
 * 
 * 4. Color Usage Rules:
 *    - Primary (coral): ONLY for urgent/attention states
 *    - Destructive (red variant): ONLY for true errors/destructive actions
 *    - Foreground/muted: Everything else
 *    - DO NOT introduce new semantic colors without review
 * 
 * 5. Migration Pattern:
 *    BEFORE (color-coded):
 *    <Badge className="bg-green-100 text-green-800">Success</Badge>
 *    <Badge className="bg-red-100 text-red-800">Error</Badge>
 *    <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
 * 
 *    AFTER (minimal color):
 *    <StatusBadge status="success" />
 *    <StatusBadge status="error" />
 *    <StatusBadge status="warning" />
 * 
 *    BEFORE (color-coded trip):
 *    <div className="bg-blue-100 text-blue-800">Scheduled</div>
 *    <div className="bg-yellow-100 text-yellow-800">In Progress</div>
 * 
 *    AFTER (minimal color):
 *    <TripProgressMeter status="scheduled" />
 *    <TripProgressMeter status="in_progress" />
 * 
 *    BEFORE (color-coded priority):
 *    <Badge className="bg-red-100 text-red-800">High Priority</Badge>
 * 
 *    AFTER (minimal color):
 *    <PriorityIndicator level="high" label="Critical task" />
 */


