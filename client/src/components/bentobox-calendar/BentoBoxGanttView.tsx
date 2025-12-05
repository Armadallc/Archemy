/**
 * BentoBox Calendar - Gantt View Component
 * 
 * Gantt-style calendar with:
 * - X-axis: Days (infinite scroll)
 * - Y-axis: Time slots
 * - Color-coded encounter blocks
 * - Drag-and-drop support
 */

import React, { useRef, useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, addWeeks, setHours, setMinutes } from 'date-fns';
import { useBentoBoxStore } from './store';
import { ScheduledEncounter, FireColor } from './types';
import { EncounterActions } from './EncounterActions';
import { cn } from '../../lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';

interface BentoBoxGanttViewProps {
  currentDate: Date;
  onDateChange?: (date: Date) => void;
}

export function BentoBoxGanttView({ currentDate, onDateChange }: BentoBoxGanttViewProps) {
  const { scheduledEncounters, currentView, setCurrentDate, library, scheduleEncounter, updateScheduledEncounter } = useBentoBoxStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeSlotRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [draggedOverSlot, setDraggedOverSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [draggedEncounter, setDraggedEncounter] = useState<ScheduledEncounter | null>(null);
  const [pixelsPerMinute, setPixelsPerMinute] = useState(0.8);

  // Generate time slots (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);
  const minutesPerSlot = 60;

  // Calculate pixels per minute based on actual rendered time slot height
  useEffect(() => {
    const calculatePixelsPerMinute = () => {
      if (timeSlotRef.current) {
        const slotHeight = timeSlotRef.current.offsetHeight;
        if (slotHeight > 0) {
          const calculatedPixelsPerMinute = slotHeight / minutesPerSlot;
          setPixelsPerMinute(calculatedPixelsPerMinute);
        }
      }
    };

    // Calculate on mount and view change
    calculatePixelsPerMinute();

    // Recalculate on window resize (for responsive height changes)
    window.addEventListener('resize', calculatePixelsPerMinute);
    
    // Use ResizeObserver for more accurate detection
    let resizeObserver: ResizeObserver | null = null;
    if (timeSlotRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(calculatePixelsPerMinute);
      resizeObserver.observe(timeSlotRef.current);
    }

    return () => {
      window.removeEventListener('resize', calculatePixelsPerMinute);
      if (resizeObserver && timeSlotRef.current) {
        resizeObserver.unobserve(timeSlotRef.current);
      }
    };
  }, [currentView, minutesPerSlot]);

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
    return scheduledEncounters.filter((encounter) => 
      isSameDay(new Date(encounter.start), day)
    );
  };

  const getColorClasses = (color: FireColor) => {
    const colorMap: Record<FireColor, string> = {
      coral: 'bg-[#ff555d]/20 text-[#ff555d] border-l-4 border-[#ff555d] hover:bg-[#ff555d]/30',
      lime: 'bg-[#f1fec9]/60 text-[#26282b] border-l-4 border-[#d4e5a8] hover:bg-[#f1fec9]/80 dark:text-[#26282b]',
      ice: 'bg-[#e8fffe]/60 text-[#26282b] border-l-4 border-[#b8e5e3] hover:bg-[#e8fffe]/80 dark:text-[#26282b]',
      charcoal: 'bg-[#26282b]/20 text-[#26282b] border-l-4 border-[#26282b] hover:bg-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
      silver: 'bg-[#eaeaea]/60 text-[#26282b] border-l-4 border-[#d4d4d4] hover:bg-[#eaeaea]/80 dark:text-[#26282b]',
    };
    return colorMap[color] || colorMap.silver;
  };

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
    
    // Calculate total minutes from 6 AM (start of calendar)
    const startMinutesFrom6AM = (startHour - 6) * 60 + startMinute;
    const endMinutesFrom6AM = (endHour - 6) * 60 + endMinute;
    
    // Calculate position and height in pixels
    const top = startMinutesFrom6AM * pixelsPerMinute;
    const height = (endMinutesFrom6AM - startMinutesFrom6AM) * pixelsPerMinute;
    
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

  const handleTimeSlotDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverSlot({ day, hour });
  };

  const handleTimeSlotDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
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

        // Calculate start and end times
        const startTime = setMinutes(setHours(day, hour), 0);
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

        // Calculate new start and end times
        const oldStart = new Date(encounter.start);
        const oldEnd = new Date(encounter.end);
        const duration = oldEnd.getTime() - oldStart.getTime();

        const newStart = setMinutes(setHours(day, hour), oldStart.getMinutes());
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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Days Header */}
      <div className="flex border-b sticky top-0 bg-background z-10 flex-shrink-0">
        {/* Time column header */}
        <div className="w-16 md:w-20 bg-muted/50 border-r flex-shrink-0"></div>
        
        {/* Days header - flex for week, scrollable for month */}
        <div className={cn(
          "flex-1",
          isWeekView ? "overflow-hidden" : "overflow-x-auto"
        )}>
          <div className={cn(
            "flex h-full",
            isWeekView ? "w-full" : "min-w-max"
          )}>
            {days.map((day) => (
              <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 text-center border-r border-b flex-shrink-0",
                    isWeekView ? "flex-1" : "min-w-[120px] md:min-w-[150px] lg:min-w-[180px]",
                    isSameDay(day, new Date()) && "bg-primary/10"
                  )}
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
      
      {/* Time Grid - Scrollable */}
      <div className={cn(
        "flex flex-1 overflow-y-auto min-h-0",
        isWeekView ? "overflow-x-hidden" : "overflow-x-auto"
      )} ref={scrollContainerRef}>
        {/* Time column - sticky */}
        <div className="w-16 md:w-20 bg-muted/50 border-r flex-shrink-0 sticky left-0 z-10">
          {timeSlots.map((hour, index) => (
            <div
              key={hour}
              ref={index === 0 ? timeSlotRef : undefined}
              className="h-12 md:h-14 border-b border-border flex items-start justify-end pr-2 md:pr-3 pt-1"
            >
              <span className="text-xs text-muted-foreground">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>
        
        {/* Days grid - flex for week, scrollable for month */}
        <div className={cn(
          "flex-1",
          isWeekView ? "overflow-hidden" : "overflow-x-auto"
        )}>
          <div className={cn(
            "flex h-full",
            isWeekView ? "w-full" : "min-w-max"
          )}>
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r relative bg-background",
                    isWeekView ? "flex-1" : "min-w-[120px] md:min-w-[150px] lg:min-w-[180px]"
                  )}
                >
                  {/* Time slots */}
                  {timeSlots.map((hour) => {
                    const isDraggedOver = draggedOverSlot?.day && 
                      isSameDay(draggedOverSlot.day, day) && 
                      draggedOverSlot.hour === hour;
                    
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "h-12 md:h-14 border-b border-border transition-colors flex-shrink-0",
                          isDraggedOver
                            ? "bg-primary/20 border-primary border-2"
                            : "hover:bg-muted/30 cursor-pointer"
                        )}
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
                    
                    return (
                      <HoverCard key={encounter.id}>
                        <HoverCardTrigger asChild>
                          <div
                            className={cn(
                              "absolute left-1 right-1 rounded-md p-2 cursor-move border text-xs shadow-sm",
                              getColorClasses(encounter.color as FireColor),
                              isDragging && "opacity-50"
                            )}
                            style={position}
                            draggable
                            onDragStart={(e) => {
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
                            onClick={(e) => {
                              e.stopPropagation();
                              // Could open edit dialog
                              console.log('Encounter clicked:', encounter);
                            }}
                          >
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
                            <EncounterActions encounter={encounter} />
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
  );
}

