/**
 * BentoBox Calendar Experiment Page
 * 
 * Experimental calendar using atomic design system:
 * - Atoms → Molecules → Organisms
 * - Gantt-style scheduling
 * - Template library with drag-and-drop
 * 
 * Two-tab layout:
 * - Tab 1: Stage (Pool) & Calendar
 * - Tab 2: Library, Template Builder & Template Editor
 */

import React, { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Droplets, Wrench } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from "date-fns";
import { BentoBoxGanttView } from "../components/bentobox-calendar/BentoBoxGanttView";
import { PoolSection } from "../components/bentobox-calendar/PoolSection";
import { LibrarySection } from "../components/bentobox-calendar/LibrarySection";
import { TemplateBuilder } from "../components/bentobox-calendar/TemplateBuilder";
import { TemplateEditor } from "../components/bentobox-calendar/TemplateEditor";
import { useBentoBoxStore } from "../components/bentobox-calendar/store";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { cn } from "../lib/utils";

export default function CalendarExperiment() {
  const {
    currentDate,
    currentView,
    setCurrentDate,
    setCurrentView,
    scheduledEncounters,
    activeTab,
    setActiveTab,
    editingTemplateId,
    setEditingTemplateId,
  } = useBentoBoxStore();

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setActiveTab('builder');
  };

  const handleSaveTemplate = () => {
    setEditingTemplateId(undefined);
    setActiveTab('stage');
  };

  const handleCancelEdit = () => {
    setEditingTemplateId(undefined);
  };

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
      <div className="flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 border-b bg-background gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold">BentoBox Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atomic Design Scheduling System - Experimental
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
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
          <div className="flex items-center gap-2 flex-wrap">
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
            <div className="text-sm font-medium min-w-[180px] md:min-w-[220px] text-center">
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "stage" | "builder")} className="flex flex-1 flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b px-4 md:px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stage" className="flex items-center justify-center gap-2">
                <Droplets className="w-4 h-4" />
                Stage & Calendar
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex items-center justify-center gap-2">
                <Wrench className="w-4 h-4" />
                Library & Builder
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Stage (Pool) & Calendar */}
          <TabsContent value="stage" className="flex flex-1 overflow-hidden m-0">
            <div className="flex flex-1 overflow-hidden">
              {/* Pool Sidebar */}
              <div className="w-full sm:w-80 md:w-96 lg:w-[400px] border-r bg-background flex flex-col overflow-hidden flex-shrink-0">
                <PoolSection onEdit={handleEditTemplate} />
              </div>

              {/* Calendar View */}
              <div className="flex-1 overflow-hidden min-w-0 min-h-0">
                <BentoBoxGanttView currentDate={currentDate} onEdit={handleEditTemplate} />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Library, Builder & Editor */}
          <TabsContent value="builder" className="flex flex-1 overflow-hidden m-0">
            <div className="flex flex-1 overflow-hidden">
              {/* Library Sidebar */}
              <div className="w-full sm:w-64 md:w-80 lg:w-96 border-r bg-background flex flex-col overflow-hidden flex-shrink-0">
                <LibrarySection />
              </div>

              {/* Builder/Editor Panel */}
              <div className="flex-1 min-w-0 border-r bg-background overflow-hidden">
                {editingTemplateId ? (
                  <TemplateEditor
                    templateId={editingTemplateId}
                    onSave={handleSaveTemplate}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <div className="h-full overflow-y-auto">
                    <div className="border-b p-4 md:p-6 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="font-medium text-base md:text-lg">Template Builder</span>
                      </div>
                    </div>
                    <TemplateBuilder />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
