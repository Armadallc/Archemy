/**
 * BentoBox Calendar - Gantt View Component
 * 
 * Gantt-style calendar with:
 * - X-axis: Days (infinite scroll)
 * - Y-axis: Time slots
 * - Color-coded encounter blocks
 * - Drag-and-drop support
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, addWeeks, setHours, setMinutes } from 'date-fns';
import { useBentoBoxStore } from './store';
import { ScheduledEncounter, FireColor, ClientGroupAtom } from './types';
import { EncounterActions } from './EncounterActions';
import { ClientGroupMergeDialog } from './ClientGroupMergeDialog';
import { cn } from '../../lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { FEATURE_FLAGS } from '../../lib/feature-flags';
import { matchesStaffFilter } from './utils/staff-filter';
import { BentoBoxWeekGrid } from './layouts/BentoBoxWeekGrid';

interface BentoBoxGanttViewProps {
  currentDate: Date;
  onDateChange?: (date: Date) => void;
  onEdit?: (templateId: string) => void;
}

export function BentoBoxGanttView({ currentDate, onDateChange, onEdit }: BentoBoxGanttViewProps) {
  const { scheduledEncounters, currentView, setCurrentDate, library, scheduleEncounter, updateScheduledEncounter, timeFormat, selectedStaffFilters } = useBentoBoxStore();
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const timeSlotRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [draggedOverSlot, setDraggedOverSlot] = useState<{ day: Date; hour: number; minutes?: number } | null>(null);
  const [draggedEncounter, setDraggedEncounter] = useState<ScheduledEncounter | null>(null);
  // Fixed pixels per minute: 96px per hour = 1.6px per minute
  const pixelsPerMinute = 96 / 60; // 1.6px per minute (matches full-calendar reference)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [pendingClientGroup, setPendingClientGroup] = useState<{ group: ClientGroupAtom; encounter: ScheduledEncounter } | null>(null);
  
  // Resize state (only when feature flag is enabled)
  const [resizingEncounter, setResizingEncounter] = useState<{
    encounter: ScheduledEncounter;
    edge: 'top' | 'bottom';
    initialY: number;
    initialStart: Date;
    initialEnd: Date;
  } | null>(null);

  // Generate time slots (6 AM to 10 PM)
  // Full 24-hour range (0-23) to match full-calendar reference
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  const minutesPerSlot = 60;

  // Uniform grid constants - ensures consistent alignment across all blocks
  const GRID_CONSTANTS = {
    // Spacing
    GUTTER: 8, // 8px gutter between columns (0.5rem)
    BLOCK_PADDING: 8, // 8px padding inside encounter blocks (0.5rem)
    BLOCK_MARGIN: 8, // 8px margin on left/right of encounter blocks (0.5rem)
    
    // Dimensions
    TIME_COLUMN_WIDTH: { base: 64, md: 80 }, // w-16 md:w-20
    DAY_COLUMN_WIDTH: { 
      week: 'flex-1', // Equal distribution for week view
      month: { base: 120, md: 150, lg: 180 } // Fixed widths for month view
    },
    TIME_SLOT_HEIGHT: { base: 48, md: 56 }, // h-12 md:h-14
    
    // Borders
    BORDER_WIDTH: 1, // 1px borders
    BORDER_COLOR: 'border-border',
    
    // Header padding
    HEADER_PADDING: 8, // 8px padding in day headers (p-2)
    TIME_COLUMN_PADDING: { right: 8, top: 4 }, // pr-2 md:pr-3 pt-1
  };

  // Sync horizontal scroll between header and calendar
  useEffect(() => {
    const headerEl = headerScrollRef.current;
    const calendarEl = calendarScrollRef.current;
    
    if (!headerEl || !calendarEl) return;
    
    const syncHeaderToCalendar = () => {
      if (headerEl && calendarEl) {
        headerEl.scrollLeft = calendarEl.scrollLeft;
      }
    };
    
    const syncCalendarToHeader = () => {
      if (headerEl && calendarEl) {
        calendarEl.scrollLeft = headerEl.scrollLeft;
      }
    };
    
    calendarEl.addEventListener('scroll', syncHeaderToCalendar);
    headerEl.addEventListener('scroll', syncCalendarToHeader);
    
    return () => {
      calendarEl.removeEventListener('scroll', syncHeaderToCalendar);
      headerEl.removeEventListener('scroll', syncCalendarToHeader);
    };
  }, [currentView]);

  // No longer needed - using fixed 96px per hour (1.6px per minute)
  // This matches the full-calendar reference styling

  // Calculate date range based on view
  const getDateRange = () => {
    switch (currentView) {
      case 'day':
        return [currentDate];
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      case 'month':
        // Show 4 weeks
        const monthStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        return Array.from({ length: 28 }, (_, i) => addDays(monthStart, i));
      default:
        return eachDayOfInterval({ 
          start: startOfWeek(currentDate, { weekStartsOn: 0 }), 
          end: endOfWeek(currentDate, { weekStartsOn: 0 }) 
        });
    }
  };

  const days = getDateRange();
  const isWeekView = currentView === 'week' && days.length === 7;
  const isMonthView = currentView === 'month' && days.length > 7;

  const getEventsForDay = (day: Date) => {
    return scheduledEncounters.filter((encounter) => {
      // Filter by day
      if (!isSameDay(new Date(encounter.start), day)) {
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

  const getColorClasses = (color: FireColor) => {
    const colorMap: Record<FireColor, string> = {
      coral: 'bg-[#ff8475]/20 text-[#ff8475] border-l-4 border-[#ff8475] hover:bg-[#ff8475]/30',
      lime: 'bg-[#f1fec9]/60 text-[#26282b] border-l-4 border-[#d4e5a8] hover:bg-[#f1fec9]/80 dark:text-[#26282b]',
      ice: 'bg-[#e8fffe]/60 text-[#26282b] border-l-4 border-[#b8e5e3] hover:bg-[#e8fffe]/80 dark:text-[#26282b]',
      charcoal: 'bg-[#26282b]/20 text-[#26282b] border-l-4 border-[#26282b] hover:bg-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
      silver: 'bg-[#eaeaea]/60 text-[#26282b] border-l-4 border-[#d4d4d4] hover:bg-[#eaeaea]/80 dark:text-[#26282b]',
    };
    return colorMap[color] || colorMap.silver;
  };

  // Format time based on user preference
  const formatTime = React.useCallback((hour: number): string => {
    // Use timeFormat from store if feature flag is enabled
    if (FEATURE_FLAGS.FULL_CALENDAR_TIME_FORMAT) {
      if (timeFormat === '24h') {
        return `${hour.toString().padStart(2, '0')}:00`;
      } else {
        // 12-hour format (timeFormat === '12h')
        return hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      }
    }
    // Default 12-hour format (fallback if feature flag disabled)
    return hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  }, [timeFormat]);

  // Force re-render when timeFormat changes by using a key
  const timeColumnKey = `time-column-${timeFormat}`;
  
  // Debug: Log timeFormat changes (can be removed in production)
  useEffect(() => {
    if (FEATURE_FLAGS.FULL_CALENDAR_TIME_FORMAT && import.meta.env.DEV) {
      console.log('🕐 Time format changed to', timeFormat);
    }
  }, [timeFormat]);

  const getEventPosition = (encounter: ScheduledEncounter) => {
    const start = new Date(encounter.start);
    const end = new Date(encounter.end);
    
    // Ensure dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { top: '0px', height: '20px' };
    }
    
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    // Calculate total minutes from midnight (0:00) - full 24-hour range
    const startMinutesFromMidnight = startHour * 60 + startMinute;
    const endMinutesFromMidnight = endHour * 60 + endMinute;
    
    // Calculate position and height in pixels
    // Using 96px per hour = 1.6px per minute
    const pixelsPerMinute = 96 / 60; // 1.6px per minute
    const top = startMinutesFromMidnight * pixelsPerMinute;
    const height = (endMinutesFromMidnight - startMinutesFromMidnight) * pixelsPerMinute;
    
    // Ensure minimum height for visibility
    const minHeight = Math.max(height, 24);
    
    return { 
      top: `${top}px`, 
      height: `${minHeight}px`,
    };
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const startTime = setMinutes(setHours(day, hour), 0);
    // Could trigger template selection or quick add
    console.log('Time slot clicked:', startTime);
  };

  // Resize handlers (only when feature flag is enabled)
  const handleResizeStart = (e: React.MouseEvent, encounter: ScheduledEncounter, edge: 'top' | 'bottom') => {
    if (!FEATURE_FLAGS.FULL_CALENDAR_RESIZE) {
      console.log('⚠️ Resize disabled - feature flag FULL_CALENDAR_RESIZE is false');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔧 Starting resize:', {
      encounterId: encounter.id,
      edge,
      currentStart: encounter.start,
      currentEnd: encounter.end,
      mouseY: e.clientY
    });
    
    setResizingEncounter({
      encounter,
      edge,
      initialY: e.clientY,
      initialStart: new Date(encounter.start),
      initialEnd: new Date(encounter.end),
    });
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingEncounter || !FEATURE_FLAGS.FULL_CALENDAR_RESIZE) return;
    
    const deltaY = e.clientY - resizingEncounter.initialY;
    const deltaMinutes = Math.round(deltaY / pixelsPerMinute);
    
    if (deltaMinutes === 0) return;
    
    const { encounter, edge, initialStart, initialEnd } = resizingEncounter;
    
    let newStart: Date;
    let newEnd: Date;
    
    if (edge === 'top') {
      // Resizing start time
      newStart = new Date(initialStart.getTime() + deltaMinutes * 60 * 1000);
      newEnd = initialEnd;
      
      // Ensure start doesn't go past end (minimum 15 minutes)
      const minDuration = 15 * 60 * 1000;
      if (newStart.getTime() >= newEnd.getTime() - minDuration) {
        newStart = new Date(newEnd.getTime() - minDuration);
      }
      
      // Ensure start is within calendar bounds (full 24-hour range: 0-23)
      const dayStart = setHours(new Date(initialStart), 0);
      const dayEnd = setHours(new Date(initialStart), 23);
      if (newStart < dayStart) newStart = dayStart;
      if (newStart > dayEnd) newStart = dayEnd;
    } else {
      // Resizing end time
      newStart = initialStart;
      newEnd = new Date(initialEnd.getTime() + deltaMinutes * 60 * 1000);
      
      // Ensure end doesn't go before start (minimum 15 minutes)
      const minDuration = 15 * 60 * 1000;
      if (newEnd.getTime() <= newStart.getTime() + minDuration) {
        newEnd = new Date(newStart.getTime() + minDuration);
      }
      
      // Ensure end is within calendar bounds (6 AM - 10 PM)
      // Ensure end is within calendar bounds (full 24-hour range: 0-23)
      const dayStart = setHours(new Date(initialEnd), 0);
      const dayEnd = setHours(new Date(initialEnd), 23);
      if (newEnd < dayStart) newEnd = dayStart;
      if (newEnd > dayEnd) newEnd = dayEnd;
    }
    
    // Update encounter temporarily for visual feedback
    updateScheduledEncounter(encounter.id, {
      start: newStart,
      end: newEnd,
    });
  }, [resizingEncounter, pixelsPerMinute, updateScheduledEncounter]);

  const handleResizeEnd = useCallback(() => {
    if (!resizingEncounter || !FEATURE_FLAGS.FULL_CALENDAR_RESIZE) return;
    
    // The encounter is already updated in handleResizeMove
    console.log('✅ Resize complete:', {
      encounterId: resizingEncounter.encounter.id,
      edge: resizingEncounter.edge
    });
    
    // Just clean up the resize state
    setResizingEncounter(null);
  }, [resizingEncounter]);

  // Set up global mouse event listeners for resize
  useEffect(() => {
    if (!resizingEncounter || !FEATURE_FLAGS.FULL_CALENDAR_RESIZE) return;
    
    const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
    const handleMouseUp = () => handleResizeEnd();
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingEncounter, handleResizeMove, handleResizeEnd]);

  // Helper function to calculate precise time from mouse position
  const calculateTimeFromPosition = (e: React.DragEvent, hour: number): number => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hourHeight = rect.height; // Height of the hour slot (96px)
    
    // Calculate fractional hour (0.0 to 1.0)
    const fractionalHour = Math.max(0, Math.min(1, y / hourHeight));
    
    // Snap to 15-minute intervals (0, 15, 30, 45)
    let minutes = 0;
    if (fractionalHour < 0.125) minutes = 0;
    else if (fractionalHour < 0.375) minutes = 15;
    else if (fractionalHour < 0.625) minutes = 30;
    else if (fractionalHour < 0.875) minutes = 45;
    else minutes = 60; // Top of next hour
    
    return minutes;
  };

  const handleTimeSlotDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Calculate precise minutes from mouse position
    const minutes = calculateTimeFromPosition(e, hour);
    
    setDraggedOverSlot({ day, hour, minutes });
  };

  const handleTimeSlotDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    
    // Calculate precise minutes from mouse position
    const minutes = calculateTimeFromPosition(e, hour);
    
    // Handle hour overflow (if minutes = 60, move to next hour)
    let finalHour = hour;
    let finalMinutes = minutes;
    if (minutes >= 60) {
      finalHour = (hour + 1) % 24;
      finalMinutes = 0;
    }
    
    setDraggedOverSlot(null);

    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const payload = JSON.parse(data);
      
      if (payload.type === 'pool-template') {
        // Get the template
        const template = library.templates.find((t) => t.id === payload.templateId);
        if (!template) {
          console.error('Template not found:', payload.templateId);
          return;
        }

        // Calculate start and end times with precise minutes
        const startTime = setMinutes(setHours(day, finalHour), finalMinutes);
        const endTime = new Date(startTime);
        
        // Get duration - ensure we're reading the correct value
        // Check if duration is a number (legacy) or an object with minutes property
        let durationMinutes: number;
        if (typeof template.duration === 'number') {
          durationMinutes = template.duration;
        } else if (template.duration?.minutes) {
          durationMinutes = template.duration.minutes;
        } else {
          // Fallback to 120 minutes if duration is missing
          console.warn('Template duration missing or invalid, using 120 minutes default:', template);
          durationMinutes = 120;
        }
        
        // Add duration to end time
        endTime.setMinutes(endTime.getMinutes() + durationMinutes);
        
        // Debug log to verify duration (can be removed after fixing)
        console.log('Scheduling encounter:', {
          templateId: payload.templateId,
          templateName: template.name,
          duration: template.duration,
          durationMinutes,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          calculatedDuration: (endTime.getTime() - startTime.getTime()) / (1000 * 60),
        });

        // Schedule the encounter
        scheduleEncounter(payload.templateId, startTime, endTime);
      } else if (payload.type === 'scheduled-encounter') {
        // Move existing encounter to new time
        const encounter = scheduledEncounters.find((e) => e.id === payload.encounterId);
        if (!encounter) {
          console.error('Encounter not found:', payload.encounterId);
          return;
        }

        // Calculate new start and end times with precise minutes
        const oldStart = new Date(encounter.start);
        const oldEnd = new Date(encounter.end);
        const duration = oldEnd.getTime() - oldStart.getTime();

        const newStart = setMinutes(setHours(day, finalHour), finalMinutes);
        const newEnd = new Date(newStart.getTime() + duration);

        // Update the encounter
        updateScheduledEncounter(payload.encounterId, {
          start: newStart,
          end: newEnd,
        });
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDraggedEncounter(null);
    }
  };

  const handleTimeSlotDragLeave = () => {
    setDraggedOverSlot(null);
  };

  const handleMergeClientGroup = () => {
    if (!pendingClientGroup) return;
    
    const { group: clientGroup, encounter } = pendingClientGroup;
    const template = library.templates.find((t) => t.id === encounter.templateId);
    
    if (template) {
      const existingClients = encounter.overrides?.clients || template.clients || [];
      const updatedClients = [...existingClients, clientGroup];
      
      updateScheduledEncounter(encounter.id, {
        overrides: {
          ...encounter.overrides,
          clients: updatedClients,
        },
      });
    }
    
    setMergeDialogOpen(false);
    setPendingClientGroup(null);
  };

  const handleReplaceClientGroup = () => {
    if (!pendingClientGroup) return;
    
    const { group: clientGroup, encounter } = pendingClientGroup;
    
    updateScheduledEncounter(encounter.id, {
      overrides: {
        ...encounter.overrides,
        clients: [clientGroup],
      },
    });
    
    setMergeDialogOpen(false);
    setPendingClientGroup(null);
  };

  const handleCancelMerge = () => {
    setMergeDialogOpen(false);
    setPendingClientGroup(null);
  };

  // Calculate hour height for new grid layout
  // Use 96px per hour to match full-calendar reference
  const hourHeight = useMemo(() => {
    return 96; // Fixed 96px per hour to match full-calendar reference
  }, []);

  // Use new grid layout for week view when feature flag is enabled
  const useNewGridLayout = FEATURE_FLAGS.FULL_CALENDAR_LAYOUT && isWeekView;

  return (
    <>
      {useNewGridLayout ? (
        // New responsive grid layout (full-calendar style)
        <BentoBoxWeekGrid
          days={days}
          timeSlots={timeSlots}
          timeColumnWidth={GRID_CONSTANTS.TIME_COLUMN_WIDTH.base}
          hourHeight={hourHeight}
          renderTimeColumn={(hour, index) => {
            const formattedTime = formatTime(hour);
            return (
              <div
                key={`time-${hour}-${timeFormat}`}
                ref={index === 0 ? timeSlotRef : undefined}
                className="absolute -top-3 right-2 flex h-6 items-center"
              >
                {index !== 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formattedTime}
                  </span>
                )}
              </div>
            );
          }}
          renderDayColumn={(day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            return (
              <>
                {/* Time slots for DnD - positioned absolutely within the day column */}
                {timeSlots.map((hour, slotIndex) => {
                  const isDraggedOver = draggedOverSlot?.day && 
                    isSameDay(draggedOverSlot.day, day) && 
                    draggedOverSlot.hour === hour;
                  
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "absolute left-0 right-0 pointer-events-none",
                        slotIndex === 0 && "border-t border-border"
                      )}
                      style={{
                        top: `${slotIndex * hourHeight}px`,
                        height: `${hourHeight}px`,
                      }}
                    >
                      {/* Solid border at hour boundary */}
                      {slotIndex !== 0 && (
                        <div className="absolute inset-x-0 top-0 border-b border-border/50 pointer-events-none" />
                      )}
                      {/* Dotted line at half-hour mark (middle of hour) */}
                      <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border/30 pointer-events-none" />
                      
                      <div
                        className={cn(
                          "absolute inset-0 transition-colors cursor-pointer",
                          isDraggedOver
                            ? "bg-primary/20 border-primary border-2 z-10"
                            : "hover:bg-muted/30"
                        )}
                        onClick={() => handleTimeSlotClick(day, hour)}
                        onDragOver={(e) => handleTimeSlotDragOver(e, day, hour)}
                        onDrop={(e) => handleTimeSlotDrop(e, day, hour)}
                        onDragLeave={handleTimeSlotDragLeave}
                        style={{ pointerEvents: 'auto' }}
                      />
                    </div>
                  );
                })}
                
                {/* Scheduled Encounters */}
                {dayEvents.map((encounter) => {
                  const position = getEventPosition(encounter);
                  const template = library.templates.find(
                    (t) => t.id === encounter.templateId
                  );
                  const isDragging = draggedEncounter?.id === encounter.id;
                  const isResizing = resizingEncounter?.encounter.id === encounter.id;
                  
                  return (
                    <HoverCard key={encounter.id}>
                      <HoverCardTrigger asChild>
                        <div
                          className={cn(
                            "absolute rounded-md border text-xs shadow-sm group",
                            getColorClasses(encounter.color as FireColor),
                            isDragging && "opacity-50",
                            isResizing && "ring-2 ring-primary ring-offset-1"
                          )}
                          style={{
                            ...position,
                            left: `${GRID_CONSTANTS.BLOCK_MARGIN}px`,
                            right: `${GRID_CONSTANTS.BLOCK_MARGIN}px`,
                            padding: `${GRID_CONSTANTS.BLOCK_PADDING}px`,
                            borderWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`
                          }}
                          draggable={!isResizing}
                          onDragStart={(e) => {
                            if (isResizing) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData('application/json', JSON.stringify({
                              type: 'scheduled-encounter',
                              encounterId: encounter.id,
                            }));
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedEncounter(encounter);
                          }}
                          onDragEnd={() => {
                            setDraggedEncounter(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const data = e.dataTransfer.getData('application/json');
                            if (!data) return;
                            
                            try {
                              const payload = JSON.parse(data);
                              
                              if (payload.type === 'client-group') {
                                const clientGroupId = payload.clientGroupId || payload.id;
                                const clientGroup = library.atoms.clientGroups.find(
                                  (g) => g.id === clientGroupId
                                );
                                
                                if (clientGroup) {
                                  const template = library.templates.find(
                                    (t) => t.id === encounter.templateId
                                  );
                                  
                                  if (template) {
                                    const existingClients = encounter.overrides?.clients || template.clients || [];
                                    const existingCount = existingClients.reduce((count, c) => {
                                      if (c.type === 'client') return count + 1;
                                      if (c.type === 'client-group') return count + (c.clientIds?.length || 0);
                                      return count;
                                    }, 0);
                                    
                                    setPendingClientGroup({ group: clientGroup, encounter });
                                    setMergeDialogOpen(true);
                                  }
                                }
                              }
                            } catch (error) {
                              console.error('Error handling drop on encounter:', error);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Encounter clicked:', encounter);
                          }}
                        >
                          {/* Top resize handle */}
                          {FEATURE_FLAGS.FULL_CALENDAR_RESIZE && (
                            <div
                              className={cn(
                                "absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-10",
                                "opacity-0 group-hover:opacity-100 transition-opacity",
                                "hover:bg-primary/20 rounded-t-md"
                              )}
                              onMouseDown={(e) => handleResizeStart(e, encounter, 'top')}
                              title="Drag to resize start time"
                            />
                          )}
                          
                          {/* Content */}
                          <div className="cursor-move">
                            <div className="font-medium truncate">{encounter.title}</div>
                            <div className="text-xs opacity-75 mt-0.5">
                              {format(new Date(encounter.start), "h:mm a")} - {format(new Date(encounter.end), "h:mm a")}
                            </div>
                            {template && (
                              <div className="text-xs opacity-60 mt-1">
                                {template.staff.map(s => s.name).join(', ')}
                              </div>
                            )}
                          </div>
                          
                          {/* Bottom resize handle */}
                          {FEATURE_FLAGS.FULL_CALENDAR_RESIZE && (
                            <div
                              className={cn(
                                "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10",
                                "opacity-0 group-hover:opacity-100 transition-opacity",
                                "hover:bg-primary/20 rounded-b-md"
                              )}
                              onMouseDown={(e) => handleResizeStart(e, encounter, 'bottom')}
                              title="Drag to resize end time"
                            />
                          )}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-semibold">{encounter.title}</h4>
                            {encounter.description && (
                              <p className="text-sm text-muted-foreground">{encounter.description}</p>
                            )}
                          </div>
                          {template && (
                            <>
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Staff</div>
                                <div className="text-sm">
                                  {template.staff.map(s => s.name).join(', ')}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Activity</div>
                                <div className="text-sm">{template.activity.name}</div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Clients</div>
                                <div className="text-sm">
                                  {template.clients.length} {template.clients.length === 1 ? 'client' : 'clients'}
                                </div>
                              </div>
                              {template.location && (
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Location</div>
                                  <div className="text-sm">{template.location.name}</div>
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Duration</div>
                                <div className="text-sm">{template.duration.label}</div>
                              </div>
                            </>
                          )}
                          <EncounterActions 
                            encounter={encounter} 
                            onEdit={() => onEdit && onEdit(encounter.templateId)}
                          />
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </>
            );
          }}
          renderTimeSlot={(day, hour, dayIndex, slotIndex) => {
            // Time slot container - provides structure for the grid
            // Actual interactive slots are rendered in renderDayColumn
            return (
              <div
                key={hour}
                className="relative"
                style={{ height: `${hourHeight}px` }}
              >
                {/* Solid border at hour boundary */}
                {slotIndex !== 0 && (
                  <div className="absolute inset-x-0 top-0 border-b border-border/50 pointer-events-none" />
                )}
                {/* Dotted line at half-hour mark (middle of hour) */}
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border/30 pointer-events-none" />
              </div>
            );
          }}
        />
      ) : (
        // Original layout (fallback)
        <div className="flex flex-col flex-1 min-h-0 bg-background rounded-lg">
      {/* Days Header */}
      <div className="flex border-b border-r sticky top-0 bg-background z-10 flex-shrink-0 rounded-t-lg" style={{ borderBottomWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px` }}>
        {/* Time column header */}
        <div 
          className="bg-muted/50 border-r flex-shrink-0" 
          style={{ 
            width: `${GRID_CONSTANTS.TIME_COLUMN_WIDTH.base}px`,
            borderRightWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`
          }}
        >
          <div className="hidden md:block" style={{ width: `${GRID_CONSTANTS.TIME_COLUMN_WIDTH.md}px` }}></div>
        </div>
        
        {/* Days header - flex for week, scrollable for month */}
        <div 
          className={cn(
            "flex-1",
            isWeekView ? "overflow-hidden" : "overflow-x-auto"
          )} 
          ref={headerScrollRef}
        >
          <div className={cn(
            "flex h-full",
            isWeekView ? "w-full" : "min-w-max"
          )}>
            {days.map((day) => (
              <div
                  key={day.toISOString()}
                  className={cn(
                    "text-center border-r border-b flex-shrink-0",
                    isSameDay(day, new Date()) && "bg-primary/10",
                    isWeekView ? "flex-1" : "min-w-[120px] md:min-w-[150px] lg:min-w-[180px]"
                  )}
                  style={{
                    padding: `${GRID_CONSTANTS.HEADER_PADDING}px`,
                    borderRightWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`,
                    borderBottomWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`
                  }}
                >
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, "EEE")}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  isSameDay(day, new Date()) && "text-primary"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Time Grid */}
      <div className={cn(
        "flex flex-1 min-h-0 overflow-hidden",
        isWeekView ? "" : "overflow-x-auto"
      )}>
        {/* Time column - sticky */}
        <div 
          key={timeColumnKey}
          className="bg-muted/50 border-r flex-shrink-0 sticky left-0 z-10 flex flex-col min-h-0 self-stretch" 
          style={{ 
            width: `${GRID_CONSTANTS.TIME_COLUMN_WIDTH.base}px`,
            borderRightWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`
          }}
        >
          {timeSlots.map((hour, index) => {
            const isLastSlot = index === timeSlots.length - 1;
            const formattedTime = formatTime(hour);
            return (
                <div
                  key={`time-${hour}-${timeFormat}`}
                  ref={index === 0 ? timeSlotRef : undefined}
                  className="flex items-start justify-end flex-1 min-h-12 md:min-h-14"
                  style={{
                    paddingRight: `${GRID_CONSTANTS.TIME_COLUMN_PADDING.right}px`,
                    paddingTop: `${GRID_CONSTANTS.TIME_COLUMN_PADDING.top}px`,
                    borderBottomWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`,
                    borderBottomColor: 'var(--border)'
                  }}
                >
                  <span 
                    key={`time-text-${hour}-${timeFormat}`}
                    className="text-xs text-muted-foreground"
                  >
                    {formattedTime}
                  </span>
                </div>
            );
          })}
        </div>
        
        {/* Days grid - flex for week, scrollable for month */}
        <div 
          className={cn(
            "flex-1 min-h-0 flex flex-col self-stretch border-r",
            isWeekView ? "" : "overflow-x-auto"
          )}
          ref={calendarScrollRef}
        >
          <div className={cn(
            "flex flex-1 min-h-0",
            isWeekView ? "w-full" : "min-w-max",
            !isWeekView && "pr-4"
          )}>
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r relative bg-background flex flex-col flex-1 min-h-0",
                    isWeekView ? "flex-shrink-0" : "flex-shrink-0 min-w-[120px] md:min-w-[150px] lg:min-w-[180px]"
                  )}
                  style={{
                    borderRightWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`
                  }}
                >
                  {/* Time slots - uniform height ensures horizontal alignment */}
                  {timeSlots.map((hour, slotIndex) => {
                    const isDraggedOver = draggedOverSlot?.day && 
                      isSameDay(draggedOverSlot.day, day) && 
                      draggedOverSlot.hour === hour;
                    const isLastSlot = slotIndex === timeSlots.length - 1;
                    
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "transition-colors flex-1 min-h-12 md:min-h-14",
                          isDraggedOver
                            ? "bg-primary/20 border-primary"
                            : "hover:bg-muted/30 cursor-pointer"
                        )}
                        style={{
                          borderBottomWidth: !isDraggedOver ? `${GRID_CONSTANTS.BORDER_WIDTH}px` : '2px',
                          borderBottomColor: !isDraggedOver ? 'var(--border)' : 'var(--primary)'
                        }}
                        onClick={() => handleTimeSlotClick(day, hour)}
                        onDragOver={(e) => handleTimeSlotDragOver(e, day, hour)}
                        onDrop={(e) => handleTimeSlotDrop(e, day, hour)}
                        onDragLeave={handleTimeSlotDragLeave}
                      />
                    );
                  })}
                  
                  {/* Scheduled Encounters */}
                  {dayEvents.map((encounter) => {
                    const position = getEventPosition(encounter);
                    const template = library.templates.find(
                      (t) => t.id === encounter.templateId
                    );
                    const isDragging = draggedEncounter?.id === encounter.id;
                    
                    const isResizing = resizingEncounter?.encounter.id === encounter.id;
                    
                    return (
                      <HoverCard key={encounter.id}>
                        <HoverCardTrigger asChild>
                          <div
                            className={cn(
                              "absolute rounded-md border text-xs shadow-sm group",
                              getColorClasses(encounter.color as FireColor),
                              isDragging && "opacity-50",
                              isResizing && "ring-2 ring-primary ring-offset-1"
                            )}
                            style={{
                              ...position,
                              left: `${GRID_CONSTANTS.BLOCK_MARGIN}px`,
                              right: `${GRID_CONSTANTS.BLOCK_MARGIN}px`,
                              padding: `${GRID_CONSTANTS.BLOCK_PADDING}px`,
                              borderWidth: `${GRID_CONSTANTS.BORDER_WIDTH}px`
                            }}
                            draggable={!isResizing}
                            onDragStart={(e) => {
                              if (isResizing) {
                                e.preventDefault();
                                return;
                              }
                              e.dataTransfer.setData('application/json', JSON.stringify({
                                type: 'scheduled-encounter',
                                encounterId: encounter.id,
                              }));
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedEncounter(encounter);
                            }}
                            onDragEnd={() => {
                              setDraggedEncounter(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const data = e.dataTransfer.getData('application/json');
                              if (!data) return;
                              
                              try {
                                const payload = JSON.parse(data);
                                
                                if (payload.type === 'client-group') {
                                  // Handle client group drop on encounter
                                  const clientGroupId = payload.clientGroupId || payload.id;
                                  const clientGroup = library.atoms.clientGroups.find(
                                    (g) => g.id === clientGroupId
                                  );
                                  
                                  if (clientGroup) {
                                    // Get the template to calculate existing client count
                                    const template = library.templates.find(
                                      (t) => t.id === encounter.templateId
                                    );
                                    
                                    if (template) {
                                      // Calculate existing client count (from template + overrides)
                                      const existingClients = encounter.overrides?.clients || template.clients || [];
                                      const existingCount = existingClients.reduce((count, c) => {
                                        if (c.type === 'client') return count + 1;
                                        if (c.type === 'client-group') return count + (c.clientIds?.length || 0);
                                        return count;
                                      }, 0);
                                      
                                      // Show merge dialog
                                      setPendingClientGroup({ group: clientGroup, encounter });
                                      setMergeDialogOpen(true);
                                    }
                                  }
                                }
                              } catch (error) {
                                console.error('Error handling drop on encounter:', error);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Could open edit dialog
                              console.log('Encounter clicked:', encounter);
                            }}
                          >
                            {/* Top resize handle */}
                            {FEATURE_FLAGS.FULL_CALENDAR_RESIZE && (
                              <div
                                className={cn(
                                  "absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-10",
                                  "opacity-0 group-hover:opacity-100 transition-opacity",
                                  "hover:bg-primary/20 rounded-t-md"
                                )}
                                onMouseDown={(e) => handleResizeStart(e, encounter, 'top')}
                                title="Drag to resize start time"
                              />
                            )}
                            
                            {/* Content */}
                            <div className="cursor-move">
                              <div className="font-medium truncate">{encounter.title}</div>
                              <div className="text-xs opacity-75 mt-0.5">
                                {format(new Date(encounter.start), "h:mm a")} - {format(new Date(encounter.end), "h:mm a")}
                              </div>
                              {template && (
                                <div className="text-xs opacity-60 mt-1">
                                  {template.staff.map(s => s.name).join(', ')}
                                </div>
                              )}
                            </div>
                            
                            {/* Bottom resize handle */}
                            {FEATURE_FLAGS.FULL_CALENDAR_RESIZE && (
                              <div
                                className={cn(
                                  "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10",
                                  "opacity-0 group-hover:opacity-100 transition-opacity",
                                  "hover:bg-primary/20 rounded-b-md"
                                )}
                                onMouseDown={(e) => handleResizeStart(e, encounter, 'bottom')}
                                title="Drag to resize end time"
                              />
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-semibold">{encounter.title}</h4>
                              {encounter.description && (
                                <p className="text-sm text-muted-foreground">{encounter.description}</p>
                              )}
                            </div>
                            {template && (
                              <>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Staff</div>
                                  <div className="text-sm">
                                    {template.staff.map(s => s.name).join(', ')}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Activity</div>
                                  <div className="text-sm">{template.activity.name}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Clients</div>
                                  <div className="text-sm">
                                    {template.clients.length} {template.clients.length === 1 ? 'client' : 'clients'}
                                  </div>
                                </div>
                                {template.location && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground">Location</div>
                                    <div className="text-sm">{template.location.name}</div>
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Duration</div>
                                  <div className="text-sm">{template.duration.label}</div>
                                </div>
                              </>
                            )}
                            <EncounterActions 
                              encounter={encounter} 
                              onEdit={() => onEdit && onEdit(encounter.templateId)}
                            />
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
        </div>
      )}
      
      {/* Client Group Merge Dialog - Outside conditional layout */}
      {pendingClientGroup && (
        <ClientGroupMergeDialog
          open={mergeDialogOpen}
          clientGroup={pendingClientGroup.group}
          encounterTitle={pendingClientGroup.encounter.title}
          existingClientCount={(() => {
            const encounter = pendingClientGroup.encounter;
            const template = library.templates.find((t) => t.id === encounter.templateId);
            if (!template) return 0;
            const existingClients = encounter.overrides?.clients || template.clients || [];
            return existingClients.reduce((count, c) => {
              if (c.type === 'client') return count + 1;
              if (c.type === 'client-group') return count + (c.clientIds?.length || 0);
              return count;
            }, 0);
          })()}
          onMerge={handleMergeClientGroup}
          onReplace={handleReplaceClientGroup}
          onCancel={handleCancelMerge}
        />
      )}
    </>
  );
}

