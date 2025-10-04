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
}

const sizeClasses = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
  full: 'col-span-4'
};

export default function Widget({ 
  title, 
  children, 
  className, 
  size = 'medium',
  icon,
  actions,
  loading = false,
  error
}: WidgetProps) {
  return (
    <Card className={cn("h-full", sizeClasses[size], className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span>{title}</span>
          </div>
          {actions && <div className="flex items-center space-x-1">{actions}</div>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
