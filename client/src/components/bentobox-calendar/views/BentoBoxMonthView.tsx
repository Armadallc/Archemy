/**
 * BentoBox Calendar - Month View Component
 * 
 * Month view implementation based on full-calendar library
 * Shows a full month grid with encounters displayed as blocks
 */

import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  isToday
} from 'date-fns';
import { useBentoBoxStore } from '../store';
import { ScheduledEncounter, FireColor } from '../types';
import { cn } from '../../../lib/utils';
import { FEATURE_FLAGS } from '../../../lib/feature-flags';
import { matchesStaffFilter } from '../utils/staff-filter';

interface BentoBoxMonthViewProps {
  currentDate: Date;
  onDateChange?: (date: Date) => void;
  onEncounterClick?: (encounter: ScheduledEncounter) => void;
}

export function BentoBoxMonthView({ 
  currentDate, 
  onDateChange,
  onEncounterClick 
}: BentoBoxMonthViewProps) {
  const { scheduledEncounters, timeFormat, selectedStaffFilters, library } = useBentoBoxStore();

  // Only render if feature flag is enabled
  if (!FEATURE_FLAGS.FULL_CALENDAR_MONTH_VIEW) {
    return null;
  }

  // Get month boundaries
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate all days in the calendar view (6 weeks = 42 days)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get encounters for a specific day
  const getEncountersForDay = (day: Date): ScheduledEncounter[] => {
    return scheduledEncounters.filter((encounter) => {
      const encounterDate = new Date(encounter.start);
      if (!isSameDay(encounterDate, day)) {
        return false;
      }
      
      // Filter by staff if feature flag is enabled and filters are selected
      if (FEATURE_FLAGS.FULL_CALENDAR_STAFF_FILTER && selectedStaffFilters.length > 0) {
        const template = library.templates.find(t => t.id === encounter.templateId);
        return matchesStaffFilter(encounter, selectedStaffFilters, template);
      }
      
      return true;
    });
  };

  // Format time based on user preference
  const formatTime = (date: Date): string => {
    if (FEATURE_FLAGS.FULL_CALENDAR_TIME_FORMAT && timeFormat === '24h') {
      return format(date, 'HH:mm');
    }
    return format(date, 'h:mm a');
  };

  // Get color classes for encounter
  const getColorClasses = (color: FireColor) => {
    const colorMap: Record<FireColor, string> = {
      coral: 'bg-[#ff8475]/20 text-[#ff8475] border-l-2 border-[#ff8475]',
      lime: 'bg-[#f1fec9]/60 text-[#26282b] border-l-2 border-[#d4e5a8]',
      ice: 'bg-[#e8fffe]/60 text-[#26282b] border-l-2 border-[#b8e5e3]',
      charcoal: 'bg-[#26282b]/20 text-[#26282b] border-l-2 border-[#26282b] dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
      silver: 'bg-[#eaeaea]/60 text-[#26282b] border-l-2 border-[#d4d4d4]',
    };
    return colorMap[color] || colorMap.silver;
  };

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Month Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/20 sticky top-0 z-10">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="flex flex-col">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7 border-b last:border-b-0 flex-1 min-h-[120px]"
            >
              {week.map((day, dayIndex) => {
                const dayEncounters = getEncountersForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-r last:border-r-0 p-1 min-h-[120px]",
                      !isCurrentMonth && "bg-muted/10",
                      isCurrentDay && "bg-primary/5"
                    )}
                  >
                    {/* Day number */}
                    <div
                      className={cn(
                        "text-xs font-medium mb-1",
                        isCurrentDay && "text-primary font-bold",
                        !isCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {format(day, 'd')}
                    </div>

                    {/* Encounters for this day */}
                    <div className="space-y-0.5">
                      {dayEncounters.slice(0, 3).map((encounter) => {
                        const startTime = new Date(encounter.start);
                        const endTime = new Date(encounter.end);
                        const duration = Math.round(
                          (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                        );

                        return (
                          <div
                            key={encounter.id}
                            onClick={() => onEncounterClick?.(encounter)}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded cursor-pointer truncate",
                              "hover:opacity-80 transition-opacity",
                              getColorClasses(encounter.color)
                            )}
                            title={`${encounter.title} - ${formatTime(startTime)} - ${formatTime(endTime)}`}
                          >
                            <div className="font-medium truncate">
                              {encounter.title}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {formatTime(startTime)} - {duration}m
                            </div>
                          </div>
                        );
                      })}
                      {dayEncounters.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1.5 py-0.5">
                          +{dayEncounters.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

