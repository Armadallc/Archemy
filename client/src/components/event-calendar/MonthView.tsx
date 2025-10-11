import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays } from "date-fns";
import { CalendarEvent } from "./types";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
}

export function MonthView({ currentDate, events, onEventSelect, onEventCreate }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
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

  return (
    <div className="flex flex-col h-full">
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 flex-1">
        {days.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={`bg-white p-1 min-h-[120px] ${
                !isCurrentMonth ? "text-gray-400" : ""
              } ${isToday ? "bg-blue-50" : ""}`}
              onClick={() => onEventCreate(day)}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
                {format(day, "d")}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 border ${getEventColor(event.color)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventSelect(event);
                    }}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {format(event.start, "h:mm a")}
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}







