/**
 * BentoBox Calendar Experiment Page
 * 
 * Experimental calendar using atomic design system:
 * - Atoms → Molecules → Organisms
 * - Gantt-style scheduling
 * - Template library with drag-and-drop
 */

import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from "date-fns";
import { BentoBoxSidebar } from "../components/bentobox-calendar/BentoBoxSidebar";
import { BentoBoxGanttView } from "../components/bentobox-calendar/BentoBoxGanttView";
import { useBentoBoxStore } from "../components/bentobox-calendar/store";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

export default function CalendarExperiment() {
  const {
    currentDate,
    currentView,
    setCurrentDate,
    setCurrentView,
    scheduledEncounters,
  } = useBentoBoxStore();

  const handlePrevious = () => {
    switch (currentView) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (currentView) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeLabel = () => {
    switch (currentView) {
      case "day":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "week":
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "month":
        return format(currentDate, "MMMM yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-bold">BentoBox Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atomic Design Scheduling System - Experimental
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("day")}
              className={cn(
                "h-8",
                currentView === "day" && "bg-background shadow-sm"
              )}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Day
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("week")}
              className={cn(
                "h-8",
                currentView === "week" && "bg-background shadow-sm"
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("month")}
              className={cn(
                "h-8",
                currentView === "month" && "bg-background shadow-sm"
              )}
            >
              <CalendarDays className="w-4 h-4 mr-1" />
              Month
            </Button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium min-w-[200px] text-center">
              {getDateRangeLabel()}
            </div>
          </div>

          {/* Stats */}
          <div className="text-xs text-muted-foreground">
            {scheduledEncounters.length} scheduled
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar - Responsive width */}
        <div className="flex-shrink-0 h-full overflow-hidden">
          <BentoBoxSidebar />
        </div>

        {/* Calendar View - Takes remaining space */}
        <div className="flex-1 overflow-hidden min-w-0 min-h-0">
          <BentoBoxGanttView currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
}
