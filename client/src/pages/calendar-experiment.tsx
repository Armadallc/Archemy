/**
 * BentoBox Calendar Experiment Page
 * 
 * Experimental calendar using atomic design system:
 * - Atoms → Molecules → Organisms
 * - Gantt-style scheduling
 * - Template library with drag-and-drop
 */

import React, { useState, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from "date-fns";
import { BentoBoxGanttView } from "../components/bentobox-calendar/BentoBoxGanttView";
import { PoolSection } from "../components/bentobox-calendar/PoolSection";
import { LibrarySection } from "../components/bentobox-calendar/LibrarySection";
import { TemplateBuilder } from "../components/bentobox-calendar/TemplateBuilder";
import { TemplateEditor } from "../components/bentobox-calendar/TemplateEditor";
import { ClientGroupBuilder } from "../components/bentobox-calendar/ClientGroupBuilder";
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
    setEditingTemplateId(null);
    setActiveTab('stage');
  };

  const handleCancelEdit = () => {
    setEditingTemplateId(null);
    setActiveTab('stage');
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "stage" | "builder")} className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 pt-2 border-b">
            <TabsList className="w-full max-w-md md:max-w-lg">
              <TabsTrigger value="stage" className="flex-1">
                Tab 1: Stage & Calendar
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex-1">
                Tab 2: Library & Builder
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Stage & Calendar */}
          <TabsContent value="stage" className="flex-1 overflow-hidden m-0 mt-0">
            <div className="flex h-full overflow-hidden">
              {/* Pool Section */}
              <div className="w-full sm:w-80 md:w-96 lg:w-[400px] border-r flex-shrink-0 overflow-hidden">
                <PoolSection onEdit={handleEditTemplate} />
              </div>

              {/* Calendar View */}
              <div className="flex-1 overflow-hidden min-w-0 min-h-0">
                <BentoBoxGanttView 
                  currentDate={currentDate} 
                  onEdit={handleEditTemplate}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Library, Template Builder & Template Editor */}
          <TabsContent value="builder" className="flex-1 overflow-hidden m-0 mt-0">
            <div className="flex h-full overflow-hidden">
              {/* Library Section */}
              <div className="w-full sm:w-64 md:w-80 lg:w-96 border-r flex-shrink-0 overflow-hidden">
                <LibrarySection />
              </div>

              {/* Builder or Editor */}
              <div className="flex-1 overflow-hidden min-w-0">
                {editingTemplateId ? (
                  <TemplateEditor
                    templateId={editingTemplateId}
                    onSave={handleSaveTemplate}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <TemplateBuilder />
                    </div>
                    <div className="flex-shrink-0 border-t bg-background">
                      <ClientGroupBuilder 
                        onAddToTemplate={(group) => {
                          // Get template builder instance and add group
                          const state = useBentoBoxStore.getState();
                          const currentTemplate = state.builderTemplate || {
                            staff: [],
                            activity: undefined,
                            clients: [],
                            location: undefined,
                            duration: undefined,
                            category: 'life-skills',
                          };
                          
                          // Add group to template
                          const updated = {
                            ...currentTemplate,
                            clients: [...(currentTemplate.clients || []), group],
                          };
                          state.setBuilderTemplate(updated);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
