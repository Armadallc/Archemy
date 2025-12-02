import React from "react";
import { Badge } from "./badge";
import { CheckCircle, Clock, XCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

export type StatusType = 'success' | 'pending' | 'error' | 'warning' | 'info' | 'attention';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * StatusBadge - Minimal color status indicator
 * 
 * Uses text labels, icons, and outline styling instead of color coding.
 * Only uses accent (coral) for "attention" states that need immediate action.
 * 
 * @example
 * <StatusBadge status="success" />
 * <StatusBadge status="attention" label="URGENT" />
 * <StatusBadge status="error" label="CANCELLED" showIcon={false} />
 */
export function StatusBadge({ 
  status, 
  label, 
  showIcon = true,
  className 
}: StatusBadgeProps) {
  const config = {
    success: {
      icon: CheckCircle,
      label: 'SUCCESS',
      className: 'border-border text-foreground',
    },
    pending: {
      icon: Clock,
      label: 'PENDING',
      className: 'border-border text-muted-foreground',
    },
    error: {
      icon: XCircle,
      label: 'ERROR',
      className: 'border-destructive text-destructive',
    },
    warning: {
      icon: AlertTriangle,
      label: 'WARNING',
      className: 'border-border text-foreground',
    },
    info: {
      icon: Info,
      label: 'INFO',
      className: 'border-border text-muted-foreground',
    },
    attention: {
      icon: AlertCircle,
      label: 'ATTENTION',
      className: 'border-primary text-primary', // Uses coral accent for emphasis
    },
  };

  const { icon: Icon, label: defaultLabel, className: statusClassName } = config[status];
  const displayLabel = label || defaultLabel;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-semibold text-xs uppercase",
        statusClassName,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{displayLabel}</span>
    </Badge>
  );
}

/**
 * Compact version without text, icon only
 */
export function StatusIcon({ 
  status, 
  className 
}: { 
  status: StatusType; 
  className?: string;
}) {
  const config = {
    success: { icon: CheckCircle, className: 'text-foreground' },
    pending: { icon: Clock, className: 'text-muted-foreground' },
    error: { icon: XCircle, className: 'text-destructive' },
    warning: { icon: AlertTriangle, className: 'text-foreground' },
    info: { icon: Info, className: 'text-muted-foreground' },
    attention: { icon: AlertCircle, className: 'text-primary' },
  };

  const { icon: Icon, className: iconClassName } = config[status];

  return <Icon className={cn("h-4 w-4", iconClassName, className)} />;
}

