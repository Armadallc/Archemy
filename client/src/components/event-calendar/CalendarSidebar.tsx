import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useCalendarContext } from "./calendar-context";
import { useHierarchy } from "../../hooks/useHierarchy";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isSameMonth } from "date-fns";

interface CalendarSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CalendarSidebar({ isCollapsed, onToggle }: CalendarSidebarProps) {
  const { currentDate, setCurrentDate } = useCalendarContext();
  const { level } = useHierarchy();
  // Use context date for mini calendar - syncs with main calendar
  const sidebarDate = currentDate;
  
  // Calculate calendar days for mini calendar
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(sidebarDate);
    const monthEnd = endOfMonth(sidebarDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [sidebarDate]);

  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-full flex flex-col`} style={{ color: 'var(--gray-12)', backgroundColor: 'var(--gray-1)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--gray-7)' }}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--gray-1)' }}>
                <Calendar className="w-5 h-5" style={{ color: 'var(--gray-12)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Calendar</h2>
                <Badge variant="outline" className="mt-1" style={{ color: 'var(--gray-11)', borderColor: 'var(--gray-7)', backgroundColor: 'rgba(47, 47, 49, 0.5)' }}>
                  {level === 'corporate' ? 'Universal View' : 
                   level === 'program' ? 'Program View' : 
                   level === 'client' ? 'Corporate View' : 'Default View'}
                </Badge>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--gray-1)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--gray-12)' }} />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            style={{ color: 'var(--gray-12)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mini Calendar */}
      {!isCollapsed && (
        <div className="p-4 border-b" style={{ borderColor: 'var(--gray-7)' }}>
          <div className="text-center">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(sidebarDate, 1))}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent dark:hover:bg-accent/50 has-[>svg]:px-3 size-8 text-muted-foreground/80 hover:text-foreground p-0"
                aria-label="Go to the Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-sm font-medium">{format(sidebarDate, "MMMM yyyy")}</div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(sidebarDate, 1))}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent dark:hover:bg-accent/50 has-[>svg]:px-3 size-8 text-muted-foreground/80 hover:text-foreground p-0"
                aria-label="Go to the Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={index} className="p-1 text-center" style={{ color: 'var(--gray-9)' }}>{day}</div>
              ))}
              {calendarDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, sidebarDate);
                const isSelected = isSameDay(day, currentDate);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setCurrentDate(day)}
                    className="p-1 text-center rounded cursor-pointer transition-colors font-semibold"
                    style={{
                      backgroundColor: isSelected ? 'var(--gray-1)' : isTodayDate ? 'var(--blue-9)' : 'transparent',
                      color: isSelected ? 'var(--gray-12)' : isTodayDate ? 'var(--gray-12)' : isCurrentMonth ? 'var(--gray-12)' : 'var(--gray-9)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isTodayDate) {
                        e.currentTarget.style.backgroundColor = isCurrentMonth ? 'var(--gray-3)' : 'var(--gray-2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isTodayDate) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
