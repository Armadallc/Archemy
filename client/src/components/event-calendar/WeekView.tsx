import React from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays } from "date-fns";
import { CalendarEvent } from "./types";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
}

export function WeekView({ currentDate, events, onEventSelect, onEventCreate }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Generate time slots (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);
  
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  const getEventColor = (color?: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      violet: "bg-violet-100 text-violet-800 border-violet-200",
      rose: "bg-rose-100 text-rose-800 border-rose-200",
      emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return colorMap[color || "blue"] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();
    
    const top = ((startHour - 6) * 60 + startMinute) * 0.8; // 0.8px per minute
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * 0.8;
    
    return { 
      top: `${top}px`, 
      height: `${height}px`,
      minHeight: '20px' // Ensure minimum height for visibility
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Days of week header */}
      <div className="flex">
        {/* Time column header - responsive width */}
        <div className="w-12 sm:w-16 bg-gray-50 border-r border-gray-200"></div>
        
        {/* Days header - matches the 7-column grid below */}
        <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day) => (
            <div key={day.toISOString()} className="bg-gray-50 p-1 sm:p-2 text-center">
              <div className="text-xs sm:text-sm font-medium text-gray-700">
                {format(day, "EEE")}
              </div>
              <div className={`text-sm sm:text-lg ${isSameDay(day, new Date()) ? "text-blue-600 font-bold" : ""}`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Time grid */}
      <div className="flex flex-1 overflow-auto">
        {/* Time column */}
        <div className="w-12 sm:w-16 bg-gray-50 border-r">
          {timeSlots.map((hour) => (
            <div key={hour} className="h-12 border-b border-gray-200 flex items-start justify-end pr-1 sm:pr-2 pt-1">
              <span className="text-xs text-gray-500">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            
            return (
              <div key={day.toISOString()} className="bg-white relative">
                {/* Time slots */}
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onEventCreate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                  />
                ))}
                
                {/* Events */}
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`absolute left-1 right-1 rounded p-1 cursor-pointer hover:opacity-80 border text-xs ${getEventColor(event.color)}`}
                    style={getEventPosition(event)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventSelect(event);
                    }}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
