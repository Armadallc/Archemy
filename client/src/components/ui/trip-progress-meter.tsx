import React from "react";
import { XCircle, Calendar, Clock, CheckCircle, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed';

interface TripProgressMeterProps {
  status: TripStatus;
  label?: string;
  showLabel?: boolean;
  showMeter?: boolean;
  className?: string;
}

/**
 * TripProgressMeter - Visual progress indicator for trip status
 * 
 * Uses progress meters and typography instead of color coding.
 * Empty meter = scheduled, partial = in progress, full = completed.
 * Cancelled shows strike-through text with icon.
 * 
 * @example
 * <TripProgressMeter status="scheduled" />
 * <TripProgressMeter status="in_progress" />
 * <TripProgressMeter status="completed" label="DELIVERED" />
 * <TripProgressMeter status="cancelled" showMeter={false} />
 */
export function TripProgressMeter({ 
  status, 
  label,
  showLabel = true,
  showMeter = true,
  className 
}: TripProgressMeterProps) {
  const config = {
    scheduled: {
      progress: 0,
      icon: Calendar,
      label: 'SCHEDULED',
      textClassName: 'font-normal',
    },
    confirmed: {
      progress: 15,
      icon: Check,
      label: 'CONFIRMED',
      textClassName: 'font-medium',
    },
    in_progress: {
      progress: 50,
      icon: Clock,
      label: 'IN PROGRESS',
      textClassName: 'italic font-medium',
    },
    completed: {
      progress: 100,
      icon: CheckCircle,
      label: 'COMPLETE',
      textClassName: 'font-semibold',
    },
    cancelled: {
      progress: 0,
      icon: XCircle,
      label: 'CANCELLED',
      textClassName: 'line-through opacity-50',
    },
  };

  const { progress, icon: Icon, label: defaultLabel, textClassName } = config[status];
  const displayLabel = label || defaultLabel;

  // Cancelled trips show differently (no meter, just icon + strike-through text)
  if (status === 'cancelled') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {showLabel && (
          <span className={cn("text-xs text-muted-foreground", textClassName)}>
            {displayLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className={cn("text-xs", textClassName)}>
            {displayLabel}
          </span>
        </div>
      )}
      {showMeter && (
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out",
              progress === 100 ? "bg-foreground" : "bg-foreground/70"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline version (icon + text only, no meter)
 */
export function TripStatusInline({ 
  status, 
  label,
  className 
}: { 
  status: TripStatus; 
  label?: string;
  className?: string;
}) {
  return (
    <TripProgressMeter 
      status={status} 
      label={label}
      showMeter={false} 
      className={className}
    />
  );
}

/**
 * Meter-only version (no text or icon)
 */
export function TripProgressBar({ 
  status,
  className 
}: { 
  status: TripStatus;
  className?: string;
}) {
  const progress = {
    scheduled: 0,
    confirmed: 15,
    in_progress: 50,
    completed: 100,
    cancelled: 0,
  }[status];

  return (
    <div className={cn("h-1.5 w-full bg-muted rounded-full overflow-hidden", className)}>
      <div 
        className={cn(
          "h-full transition-all duration-500 ease-out",
          progress === 100 ? "bg-foreground" : "bg-foreground/70"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

