/**
 * BentoBox Week Grid Layout
 * 
 * Extracted and adapted from full-calendar's responsive grid layout
 * Uses CSS Grid for equal column widths and better responsive behavior
 * 
 * This component provides ONLY the layout structure.
 * All BentoBox logic (encounters, DnD, etc.) is handled by parent.
 */

import React, { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ScrollArea } from '../../ui/scroll-area';
import { cn } from '../../../lib/utils';

interface BentoBoxWeekGridProps {
  days: Date[];
  timeSlots: number[]; // Hours array (6-22 for 6 AM - 10 PM)
  timeColumnWidth?: number;
  hourHeight?: number; // Dynamic height per hour slot
  renderTimeColumn: (hour: number, index: number) => React.ReactNode;
  renderDayColumn: (day: Date, dayIndex: number) => React.ReactNode;
  renderTimeSlot?: (day: Date, hour: number, dayIndex: number, slotIndex: number) => React.ReactNode;
  className?: string;
}

export function BentoBoxWeekGrid({
  days,
  timeSlots,
  timeColumnWidth = 72, // w-18 = 72px
  hourHeight,
  renderTimeColumn,
  renderDayColumn,
  renderTimeSlot,
  className,
}: BentoBoxWeekGridProps) {

  // Calculate dynamic hour height if not provided
  // Default to ~56px per hour (similar to current BentoBox)
  const calculatedHourHeight = hourHeight || 56;

  // Calculate total height for ScrollArea
  // Use viewport height minus header, or fallback to fixed height
  const scrollAreaHeight = useMemo(() => {
    if (typeof window !== 'undefined') {
      // Try to use available viewport height
      const vh = window.innerHeight;
      // Estimate: header ~100px, padding ~32px, so use ~80% of viewport
      return Math.max(600, Math.floor(vh * 0.7));
    }
    return 736; // Fallback to full-calendar's default
  }, []);

  const isWeekView = days.length === 7;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Week header - matches full-calendar pattern */}
      <div className="relative z-20 flex border-b bg-background flex-shrink-0 rounded-t-lg">
        {/* Time column header spacer */}
        <div style={{ width: `${timeColumnWidth}px` }} className="flex-shrink-0" />
        
        {/* Days header - using CSS Grid for equal widths */}
        <div className="grid flex-1 grid-cols-7 border-l border-r divide-x">
          {days.map((day, index) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={index}
                className={cn(
                  "py-1 sm:py-2 text-center text-xs font-medium",
                  isToday && "text-primary font-semibold"
                )}
              >
                {/* Mobile: Show only day abbreviation and number */}
                <span className="block sm:hidden">
                  {format(day, "EEE").charAt(0)}
                  <span className="block font-semibold text-xs">
                    {format(day, "d")}
                  </span>
                </span>
                {/* Desktop: Show full format */}
                <span className="hidden sm:inline">
                  {format(day, "EE")}{" "}
                  <span className="ml-1 font-semibold">
                    {format(day, "d")}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable calendar grid */}
      <ScrollArea 
        className="flex-1" 
        style={{ height: `${scrollAreaHeight}px` }}
      >
        <div className="flex">
          {/* Time column - fixed width, sticky */}
          <div 
            className="relative flex-shrink-0 bg-muted/50 border-r sticky left-0 z-10"
            style={{ width: `${timeColumnWidth}px` }}
          >
            {timeSlots.map((hour, index) => (
              <div
                key={hour}
                className="relative"
                style={{ height: `${calculatedHourHeight}px` }}
              >
                {renderTimeColumn(hour, index)}
              </div>
            ))}
          </div>

          {/* Week grid - using CSS Grid for equal column widths */}
          <div className="relative flex-1 border-l border-r">
            <div className="grid grid-cols-7 divide-x">
              {days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="relative bg-background"
                >
                  {/* Time slots grid */}
                  {timeSlots.map((hour, slotIndex) => {
                    if (renderTimeSlot) {
                      return renderTimeSlot(day, hour, dayIndex, slotIndex);
                    }
                    // Default time slot rendering
                    return (
                      <div
                        key={hour}
                        className="relative border-b border-border/50"
                        style={{ height: `${calculatedHourHeight}px` }}
                      />
                    );
                  })}
                  
                  {/* Day column content (encounters, etc.) */}
                  {renderDayColumn(day, dayIndex)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

