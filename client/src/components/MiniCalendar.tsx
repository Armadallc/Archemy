import React, { useMemo, useContext, useState, useEffect } from "react";
import { Button } from "./ui/button";
import { 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { CalendarContext } from "./event-calendar/calendar-context";

interface MiniCalendarProps {
  className?: string;
}

export function MiniCalendar({ className = "" }: MiniCalendarProps) {
  // Try to use calendar context if available, otherwise use local state
  const calendarContext = useContext(CalendarContext);
  const [localDate, setLocalDate] = useState(new Date());
  
  // Sync with calendar page date on mount and when calendar page date changes
  useEffect(() => {
    const handleCalendarPageDateChange = (event: CustomEvent) => {
      if (event.detail?.date && !calendarContext) {
        // Only update local state if we don't have context
        setLocalDate(new Date(event.detail.date));
      }
    };
    
    window.addEventListener('calendar-page-date-change', handleCalendarPageDateChange as EventListener);
    
    return () => {
      window.removeEventListener('calendar-page-date-change', handleCalendarPageDateChange as EventListener);
    };
  }, [calendarContext]);
  
  // Use context date if available, otherwise use local state
  const sidebarDate = calendarContext?.currentDate ?? localDate;
  
  // Function to update date - uses context if available, otherwise local state
  // Also dispatches a custom event for calendar page synchronization
  const setMiniDate = (newDate: Date) => {
    if (calendarContext?.setCurrentDate) {
      // Use context if available (when inside CalendarProvider)
      calendarContext.setCurrentDate(newDate);
    } else {
      // Use local state if no context
      setLocalDate(newDate);
      
      // Dispatch custom event to sync with calendar page if it's open
      // The calendar page will listen for this event
      window.dispatchEvent(new CustomEvent('mini-calendar-date-change', { 
        detail: { date: newDate } 
      }));
    }
  };
  
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(sidebarDate);
    const monthEnd = endOfMonth(sidebarDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [sidebarDate]);

  return (
    <div className={`w-full rounded-lg p-3 bg-card border ${className}`} style={{ borderColor: 'var(--border)', borderWidth: 'var(--border-weight, 1px)' }}>
      <div className="text-center">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMiniDate(subMonths(sidebarDate, 1))}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm font-medium" style={{ fontFamily: "'Nohemi', sans-serif" }}>{format(sidebarDate, "MMMM yyyy")}</div>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMiniDate(addMonths(sidebarDate, 1))}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div key={index} className="p-1 text-center text-muted-foreground" style={{ fontFamily: "'Nohemi', sans-serif" }}>{day}</div>
          ))}
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, sidebarDate);
            const isSelected = isSameDay(day, sidebarDate);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                onClick={() => setMiniDate(day)}
                className={`p-1 text-center rounded cursor-pointer transition-colors text-xs ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground font-semibold' 
                    : isTodayDate 
                      ? 'bg-accent text-accent-foreground font-semibold' 
                      : isCurrentMonth 
                        ? 'text-foreground hover:bg-accent' 
                        : 'text-muted-foreground hover:bg-accent/50'
                }`}
                style={{ fontFamily: "'Nohemi', sans-serif" }}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

