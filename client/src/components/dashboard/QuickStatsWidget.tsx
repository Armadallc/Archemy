import React from "react";
import Widget from "./Widget";

interface QuickStatsWidgetProps {
  className?: string;
  trips?: any[];
  shadow?: 'sm' | 'xl';
}

export default function QuickStatsWidget({ className, trips = [], shadow }: QuickStatsWidgetProps) {
  const completedCount = trips?.filter((trip: any) => trip.status === 'completed').length || 0;
  const inProgressCount = trips?.filter((trip: any) => trip.status === 'in_progress').length || 0;
  const scheduledCount = trips?.filter((trip: any) => trip.status === 'scheduled').length || 0;

  return (
    <Widget
      title="Quick Stats"
      size="medium"
      className={className}
      shadow={shadow}
    >
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {completedCount}
          </div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {inProgressCount}
          </div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--blue-9)' }}>
            {scheduledCount}
          </div>
          <div className="text-xs text-muted-foreground">Scheduled</div>
        </div>
      </div>
    </Widget>
  );
}




