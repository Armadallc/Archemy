import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Users, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { useCalendarContext } from "./calendar-context";
import { format, addMonths, subMonths } from "date-fns";

interface CalendarSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CalendarSidebar({ isCollapsed, onToggle }: CalendarSidebarProps) {
  const { visibleColors, toggleColorVisibility, isColorVisible } = useCalendarContext();
  const [sidebarDate, setSidebarDate] = useState(new Date());

  const calendars = [
    { id: "my-events", name: "My Events", color: "emerald", checked: isColorVisible("emerald") },
    { id: "marketing", name: "Marketing Team", color: "orange", checked: isColorVisible("orange") },
    { id: "interviews", name: "Interviews", color: "violet", checked: isColorVisible("violet") },
    { id: "planning", name: "Events Planning", color: "blue", checked: isColorVisible("blue") },
    { id: "holidays", name: "Holidays", color: "rose", checked: isColorVisible("rose") },
  ];

  const getColorDot = (color: string) => {
    const colorMap: Record<string, string> = {
      emerald: "bg-emerald-500",
      orange: "bg-orange-500",
      violet: "bg-violet-500",
      blue: "bg-blue-500",
      rose: "bg-rose-500",
    };
    return colorMap[color] || "bg-gray-500";
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-full flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Calendar</h2>
                <p className="text-xs text-gray-400">{format(sidebarDate, "MMMM yyyy")}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5 text-gray-900" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-white hover:bg-gray-700"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mini Calendar */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-center">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSidebarDate(subMonths(sidebarDate, 1))}
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
                onClick={() => setSidebarDate(addMonths(sidebarDate, 1))}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent dark:hover:bg-accent/50 has-[>svg]:px-3 size-8 text-muted-foreground/80 hover:text-foreground p-0"
                aria-label="Go to the Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={index} className="p-1 text-center text-gray-400">{day}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`p-1 text-center rounded cursor-pointer hover:bg-gray-700 ${
                    day === 24 ? "bg-white text-gray-900" : ""
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendars List */}
      <div className="flex-1 p-4">
        {!isCollapsed && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300 mb-3">CALENDARS</h3>
            {calendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center space-x-3">
                <Checkbox
                  id={calendar.id}
                  checked={calendar.checked}
                  onCheckedChange={() => toggleColorVisibility(calendar.color)}
                  className="data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                />
                <div className={`w-3 h-3 rounded-full ${getColorDot(calendar.color)}`} />
                <label
                  htmlFor={calendar.id}
                  className="text-sm text-gray-300 cursor-pointer flex-1"
                >
                  {calendar.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">SS</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Sofia Safier</div>
              <div className="text-xs text-gray-400">sofia@company.com</div>
            </div>
            <div className="flex flex-col">
              <ChevronLeft className="w-3 h-3 text-gray-400" />
              <ChevronRight className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-sm font-medium">SS</span>
          </div>
        )}
      </div>
    </div>
  );
}
