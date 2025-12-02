import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

interface PriorityIndicatorProps {
  level: PriorityLevel;
  label?: string;
  showMeter?: boolean;
  showIcon?: boolean;
  className?: string;
}

/**
 * PriorityIndicator - Minimal color priority display
 * 
 * Uses typography weight, caps styling, and optional meter instead of color coding.
 * High priority = bold + ALL CAPS
 * Medium priority = medium weight
 * Low priority = light weight + muted
 * Urgent priority = bold + ALL CAPS + coral accent (for items needing immediate attention)
 * 
 * List order should be used as primary priority indicator (high priority at top).
 * This component provides secondary visual reinforcement.
 * 
 * @example
 * <PriorityIndicator level="high" label="Fix critical bug" />
 * <PriorityIndicator level="urgent" label="Server outage" />
 * <PriorityIndicator level="medium" label="Update docs" />
 * <PriorityIndicator level="low" label="Refactor utils" showMeter={true} />
 */
export function PriorityIndicator({ 
  level, 
  label,
  showMeter = false,
  showIcon = false,
  className 
}: PriorityIndicatorProps) {
  const config = {
    low: {
      fill: 25,
      weight: 'font-light',
      textClassName: 'text-muted-foreground',
      transform: 'normal-case',
      accentClassName: '',
    },
    medium: {
      fill: 60,
      weight: 'font-medium',
      textClassName: 'text-foreground',
      transform: 'normal-case',
      accentClassName: '',
    },
    high: {
      fill: 90,
      weight: 'font-extrabold',
      textClassName: 'text-foreground',
      transform: 'uppercase',
      accentClassName: '',
    },
    urgent: {
      fill: 100,
      weight: 'font-extrabold',
      textClassName: 'text-primary', // Uses coral accent for urgency
      transform: 'uppercase',
      accentClassName: 'text-primary',
    },
  };

  const { fill, weight, textClassName, transform, accentClassName } = config[level];
  const showUrgentIcon = level === 'urgent' && showIcon;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center gap-1.5">
          {showUrgentIcon && (
            <AlertCircle className={cn("h-3.5 w-3.5 flex-shrink-0", accentClassName)} />
          )}
          <div className={cn(
            "text-xs",
            weight,
            textClassName,
            transform
          )}>
            {label}
          </div>
        </div>
      )}
      {showMeter && (
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              level === 'urgent' ? "bg-primary" : "bg-foreground"
            )}
            style={{ width: `${fill}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge-style version
 */
export function PriorityBadge({ 
  level,
  className 
}: { 
  level: PriorityLevel;
  className?: string;
}) {
  const config = {
    low: { label: 'Low', className: 'font-light text-muted-foreground' },
    medium: { label: 'Medium', className: 'font-medium text-foreground' },
    high: { label: 'HIGH', className: 'font-extrabold text-foreground uppercase' },
    urgent: { label: 'URGENT', className: 'font-extrabold text-primary uppercase' },
  };

  const { label, className: badgeClassName } = config[level];

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs border border-border",
      badgeClassName,
      level === 'urgent' && "border-primary",
      className
    )}>
      {level === 'urgent' && <AlertCircle className="h-3 w-3 mr-1" />}
      {label}
    </span>
  );
}

/**
 * Text-only version (for inline use)
 */
export function PriorityText({ 
  level,
  className 
}: { 
  level: PriorityLevel;
  className?: string;
}) {
  const config = {
    low: { label: 'Low', className: 'font-light text-muted-foreground' },
    medium: { label: 'Medium', className: 'font-medium text-foreground' },
    high: { label: 'HIGH', className: 'font-extrabold text-foreground uppercase' },
    urgent: { label: 'URGENT', className: 'font-extrabold text-primary uppercase' },
  };

  const { label, className: textClassName } = config[level];

  return (
    <span className={cn("text-xs", textClassName, className)}>
      {label}
    </span>
  );
}

