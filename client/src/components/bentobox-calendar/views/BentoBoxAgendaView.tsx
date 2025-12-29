/**
 * BentoBox Calendar - Agenda View Component
 * 
 * Agenda/list view implementation based on full-calendar library
 * Shows encounters in a chronological list format
 */

import React, { useMemo, useState, useEffect } from 'react';
import { 
  format, 
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval
} from 'date-fns';
import { useBentoBoxStore } from '../store';
import { ScheduledEncounter, FireColor } from '../types';
import { cn } from '../../../lib/utils';
import { FEATURE_FLAGS } from '../../../lib/feature-flags';
import { matchesStaffFilter } from '../utils/staff-filter';

interface BentoBoxAgendaViewProps {
  currentDate: Date;
  onDateChange?: (date: Date) => void;
  onEncounterClick?: (encounter: ScheduledEncounter) => void;
}

export function BentoBoxAgendaView({ 
  currentDate, 
  onDateChange,
  onEncounterClick 
}: BentoBoxAgendaViewProps) {
  const { scheduledEncounters, timeFormat, selectedStaffFilters, library } = useBentoBoxStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute to trigger status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Only render if feature flag is enabled
  if (!FEATURE_FLAGS.FULL_CALENDAR_AGENDA_VIEW) {
    return null;
  }

  // Get week range for agenda view
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Group encounters by day
  const encountersByDay = useMemo(() => {
    const grouped: Record<string, ScheduledEncounter[]> = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = scheduledEncounters
        .filter(encounter => {
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
        })
        .sort((a, b) => {
          const timeA = new Date(a.start).getTime();
          const timeB = new Date(b.start).getTime();
          return timeA - timeB;
        });
    });
    
    return grouped;
  }, [scheduledEncounters, weekDays, selectedStaffFilters, library.templates]);

  // Format time based on user preference
  const formatTime = (date: Date): string => {
    if (FEATURE_FLAGS.FULL_CALENDAR_TIME_FORMAT && timeFormat === '24h') {
      return format(date, 'HH:mm');
    }
    return format(date, 'h:mm a');
  };

  // Format date header
  const formatDateHeader = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  // Calculate encounter status based on current time
  const getEncounterStatus = (encounter: ScheduledEncounter): "scheduled" | "in-progress" | "completed" | "cancelled" => {
    if (encounter.status === 'cancelled') {
      return 'cancelled';
    }
    
    const now = currentTime; // Use state variable that updates every minute
    const start = new Date(encounter.start);
    const end = new Date(encounter.end);
    
    if (now < start) return 'scheduled';
    if (now >= start && now < end) return 'in-progress';
    if (now >= end) return 'completed';
    return 'scheduled';
  };

  // Get status-based color classes
  const getStatusColorClasses = (status: "scheduled" | "in-progress" | "completed" | "cancelled") => {
    const statusColorMap = {
      scheduled: 'bg-[#7afffe]/20 text-[#7afffe] border-l-4 border-[#7afffe]',
      'in-progress': 'bg-[#f1fe60]/20 text-[#f1fe60] border-l-4 border-[#f1fe60]',
      completed: 'bg-[#3bfec9]/20 text-[#3bfec9] border-l-4 border-[#3bfec9]',
      cancelled: 'bg-[#e04850]/20 text-[#e04850] border-l-4 border-[#e04850]',
    };
    return statusColorMap[status] || statusColorMap.scheduled;
  };

  // Legacy function for backwards compatibility
  const getColorClasses = (color: FireColor) => {
    const colorMap: Record<FireColor, string> = {
      coral: 'bg-[#ff8475]/20 text-[#ff8475] border-l-4 border-[#ff8475]',
      lime: 'bg-[#f1fec9]/60 text-[#26282b] border-l-4 border-[#d4e5a8]',
      ice: 'bg-[#e8fffe]/60 text-[#26282b] border-l-4 border-[#b8e5e3]',
      charcoal: 'bg-[#1e2023]/20 text-[#1e2023] border-l-4 border-[#1e2023] dark:bg-[#1e2023]/40 dark:text-[#eaeaea]',
      silver: 'bg-[#eaeaea]/60 text-[#26282b] border-l-4 border-[#d4d4d4]',
    };
    return colorMap[color] || colorMap.silver;
  };

  // Calculate duration in minutes
  const getDuration = (start: Date, end: Date): number => {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b card-neu-flat" style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(165, 200, 202, 0.2)' }}>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>
            Agenda - {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
        </div>
      </div>

      {/* Agenda List */}
      <div className="flex-1 overflow-y-auto">
        {weekDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEncounters = encountersByDay[dayKey] || [];
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dayKey}
              className={cn(
                "border-b last:border-b-0",
                isCurrentDay && "card-neu-pressed"
              )}
              style={{ 
                backgroundColor: isCurrentDay ? 'var(--background)' : 'transparent',
                borderColor: 'rgba(165, 200, 202, 0.2)'
              }}
            >
              {/* Day Header */}
              <div
                className={cn(
                  "px-4 py-3 font-semibold text-sm sticky top-0 z-10 border-b card-neu-flat",
                  isCurrentDay && ""
                )}
                style={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'rgba(165, 200, 202, 0.2)',
                  color: '#a5c8ca'
                }}
              >
                {formatDateHeader(day)}
                {dayEncounters.length > 0 && (
                  <span className="ml-2 text-xs font-normal" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                    ({dayEncounters.length} {dayEncounters.length === 1 ? 'encounter' : 'encounters'})
                  </span>
                )}
              </div>

              {/* Encounters for this day */}
              {dayEncounters.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  No encounters scheduled
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
                  {dayEncounters.map((encounter) => {
                    const startTime = new Date(encounter.start);
                    const endTime = new Date(encounter.end);
                    const duration = getDuration(startTime, endTime);

                    const currentStatus = getEncounterStatus(encounter);
                    
                    return (
                      <div
                        key={encounter.id}
                        onClick={() => onEncounterClick?.(encounter)}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:card-neu transition-colors",
                          getStatusColorClasses(currentStatus)
                        )}
                        style={{ backgroundColor: 'var(--background)' }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                              {encounter.title}
                            </div>
                            {encounter.description && (
                              <div className="text-xs mb-1 line-clamp-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                                {encounter.description}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                              <span>
                                {formatTime(startTime)} - {formatTime(endTime)}
                              </span>
                              <span>•</span>
                              <span>{duration} min</span>
                              {encounter.location && (
                                <>
                                  <span>•</span>
                                  <span>{encounter.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {encounter.status && (
                            <div className="text-xs px-2 py-1 rounded card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                              {encounter.status}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

