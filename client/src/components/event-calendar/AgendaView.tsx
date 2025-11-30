import React from "react";
import { format, isSameDay, addDays } from "date-fns";
import { CalendarEvent } from "./types";

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
}

export function AgendaView({ currentDate, events, onEventSelect }: AgendaViewProps) {
  // Get events for the next 30 days
  const startDate = currentDate;
  const endDate = addDays(currentDate, 30);
  
  const upcomingEvents = events
    .filter(event => event.start >= startDate && event.start <= endDate)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  
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

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = format(event.start, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  };

  const groupedEvents = groupEventsByDate(upcomingEvents);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Events
        </h3>
        
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
              <div key={dateKey}>
                <div className="sticky top-0 bg-white border-b border-gray-200 py-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
                  </h4>
                </div>
                
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 ${getEventColor(event.color)}`}
                      onClick={() => onEventSelect(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{event.title}</h5>
                          {event.description && (
                            <p className="text-xs opacity-75 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                            <span>
                              {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                            </span>
                            {event.location && (
                              <span>📍 {event.location}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-2">
                          <span className={`px-2 py-1 rounded text-xs ${getEventColor(event.color)}`}>
                            {event.color || "blue"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}







