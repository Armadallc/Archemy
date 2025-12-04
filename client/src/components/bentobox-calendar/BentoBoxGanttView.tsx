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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [draggedOverSlot, setDraggedOverSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [draggedEncounter, setDraggedEncounter] = useState<ScheduledEncounter | null>(null);

  // Generate time slots (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);
  const minutesPerSlot = 60;
  const pixelsPerMinute = 0.8;

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
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    const top = ((startHour - 6) * 60 + startMinute) * pixelsPerMinute;
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * pixelsPerMinute;
    
    return { 
      top: `${top}px`, 
      height: `${Math.max(height, 20)}px`,
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
        endTime.setMinutes(endTime.getMinutes() + template.duration.minutes);

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
    <div className="flex flex-col h-full bg-background">
      {/* Days Header */}
      <div className="flex border-b sticky top-0 bg-background z-10">
        {/* Time column header */}
        <div className="w-16 bg-muted/50 border-r flex-shrink-0"></div>
        
        {/* Days header - scrollable */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-w-[120px] p-2 text-center border-r border-b",
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
      <div className="flex flex-1 overflow-auto" ref={scrollContainerRef}>
        {/* Time column - sticky */}
        <div className="w-16 bg-muted/50 border-r flex-shrink-0 sticky left-0 z-10">
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="h-12 border-b border-border flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-muted-foreground">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>
        
        {/* Days grid - scrollable */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max h-full">
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className="min-w-[120px] border-r relative bg-background"
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
                          "h-12 border-b border-border transition-colors",
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

