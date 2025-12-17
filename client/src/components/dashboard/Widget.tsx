import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  shadow?: 'sm' | 'xl';
}

const sizeClasses = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
  full: 'w-full' // Full width when not in grid context
};

export default function Widget({ 
  title, 
  children, 
  className, 
  size = 'medium',
  icon,
  actions,
  loading = false,
  error,
  shadow = 'sm'
}: WidgetProps) {
  // Override Card's default shadow-sm when shadow-xl is requested
  // The cn utility should handle class merging, but we'll explicitly set shadow-xl
  const shadowClass = shadow === 'xl' ? 'shadow-xl' : undefined;
  // Determine height class based on size and context
  const heightClass = size === 'small' ? "h-auto" : size === 'full' ? "w-full h-auto" : "h-full";
  
  // Extract max-height from className if present
  const maxHeightMatch = className?.match(/max-h-\[(\d+)px\]/);
  const maxHeight = maxHeightMatch ? `${maxHeightMatch[1]}px` : undefined;
  
  return (
    <Card 
      className={cn(
        heightClass,
        sizeClasses[size], 
        shadowClass, 
        className
      )}
      style={{
        ...(shadow === 'xl' ? { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : {}),
        ...(maxHeight ? { height: maxHeight, maxHeight: maxHeight, overflow: 'hidden' } : {})
      }}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span>{title}</span>
          </div>
          {actions && <div className="flex items-center space-x-1">{actions}</div>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-destructive">
            <div className="text-center">
              <p className="text-sm font-medium">Error loading data</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}



