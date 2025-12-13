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
        <div className="text-center shadow-xl flex flex-col justify-center items-center" style={{ height: '75px' }}>
          <div className="text-2xl font-bold text-foreground">
            {completedCount}
          </div>
          <div className="text-xs text-foreground-secondary flex flex-col justify-center items-center">Completed</div>
        </div>
        <div className="text-center shadow-xl flex flex-col justify-center items-center" style={{ height: '75px' }}>
          <div className="text-2xl font-bold text-foreground">
            {inProgressCount}
          </div>
          <div className="text-xs text-foreground-secondary flex flex-col justify-center items-center">In Progress</div>
        </div>
        <div className="text-center shadow-xl flex flex-col justify-center items-center" style={{ height: '75px' }}>
          <div className="text-2xl font-bold text-foreground">
            {scheduledCount}
          </div>
          <div className="text-xs text-foreground-secondary flex flex-col justify-center items-center">Scheduled</div>
        </div>
      </div>
    </Widget>
  );
}




