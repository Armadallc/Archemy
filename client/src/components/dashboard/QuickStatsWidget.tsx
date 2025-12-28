import React from "react";
import Widget from "./Widget";
import { cn } from "../../lib/utils";

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
      size="small"
      className={className}
      shadow={shadow}
    >
      <div className="grid grid-cols-3 gap-3" style={{ padding: '8px', margin: '-4px' }}>
        <div className="text-center card-neu flex flex-col justify-center items-center p-3 rounded-lg" style={{ minHeight: '75px', backgroundColor: 'var(--background)', border: 'none' }}>
          <div className="text-2xl font-bold text-foreground">
            {completedCount}
          </div>
          <div className="text-xs text-foreground-secondary">Completed</div>
        </div>
        <div className="text-center card-neu flex flex-col justify-center items-center p-3 rounded-lg" style={{ minHeight: '75px', backgroundColor: 'var(--background)', border: 'none' }}>
          <div className="text-2xl font-bold text-foreground">
            {inProgressCount}
          </div>
          <div className="text-xs text-foreground-secondary">In Progress</div>
        </div>
        <div className="text-center card-neu flex flex-col justify-center items-center p-3 rounded-lg" style={{ minHeight: '75px', backgroundColor: 'var(--background)', border: 'none' }}>
          <div className="text-2xl font-bold text-foreground">
            {scheduledCount}
          </div>
          <div className="text-xs text-foreground-secondary">Scheduled</div>
        </div>
      </div>
    </Widget>
  );
}




