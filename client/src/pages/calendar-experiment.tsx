/**
 * BentoBox Calendar Experiment Page
 * 
 * Experimental calendar using atomic design system:
 * - Atoms → Molecules → Organisms
 * - Gantt-style scheduling
 * - Template library with drag-and-drop
 */

import React, { useState, useRef } from "react";
import "./calendar-experiment.css";
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from "date-fns";
import { BentoBoxGanttView } from "../components/bentobox-calendar/BentoBoxGanttView";
import { PoolSection } from "../components/bentobox-calendar/PoolSection";
import { LibrarySection } from "../components/bentobox-calendar/LibrarySection";
import { TemplateBuilder } from "../components/bentobox-calendar/TemplateBuilder";
import { TemplateEditor } from "../components/bentobox-calendar/TemplateEditor";
import { ClientGroupBuilder } from "../components/bentobox-calendar/ClientGroupBuilder";
import { useBentoBoxStore } from "../components/bentobox-calendar/store";
import { Button } from "../components/ui/button";
import { RollbackManager } from "../utils/rollback-manager";
// Removed Radix Tabs - using custom implementation for better layout control
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";

export default function CalendarExperiment() {
  const { user } = useAuth();
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
  
  const [poolDrawerOpen, setPoolDrawerOpen] = useState(true);

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

  // Feature flag check - hide page header when unified header is enabled
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden p-6">
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!ENABLE_UNIFIED_HEADER && (
        <div className="flex-shrink-0 px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between mb-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
          <div className="flex items-end gap-4">
            <h1 
              className="font-bold text-foreground" 
              style={{ 
                fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                fontSize: '110px',
                lineHeight: 1
              }}
            >
              bentobox.
            </h1>
            <div 
              className="font-medium text-foreground"
              style={{ 
                fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                fontSize: '48px',
                lineHeight: 1.3
              }}
            >
              {getDateRangeLabel()}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
              <HeaderScopeSelector />
            )}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-4">
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
            </div>

            {/* Stats */}
            <div className="text-xs text-muted-foreground">
              {scheduledEncounters.length} scheduled
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex flex-1 flex-col overflow-hidden min-h-0 w-full h-full">
          {/* Custom Tab Navigation */}
          <div className="px-4 pt-2 pb-2 border-b flex-shrink-0 bg-background">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground flex-1">
                <button
                  onClick={() => setActiveTab('stage')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium transition-all flex-1",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    activeTab === 'stage'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ fontSize: '23px' }}
                >
                  STAGE & CALENDAR
                </button>
                <button
                  onClick={() => setActiveTab('builder')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium transition-all flex-1",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    activeTab === 'builder'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ fontSize: '23px' }}
                >
                  LIBRARY & BUILDER
                </button>
              </div>
              
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
            </div>
          </div>

          {/* Tab 1: Stage & Calendar */}
          {activeTab === 'stage' && (
            <div className="flex flex-1 overflow-hidden min-h-0 h-full relative">
              {/* Pool Drawer - Collapsible */}
              <div 
                className={cn(
                  "absolute left-0 top-0 bottom-0 z-20 bg-background border-r transition-all duration-300 ease-in-out overflow-hidden",
                  poolDrawerOpen 
                    ? "w-64 sm:w-72 md:w-80 shadow-lg" 
                    : "w-12"
                )}
              >
                {poolDrawerOpen ? (
                  <div className="h-full flex flex-col">
                    <div className="p-2 border-b flex items-center justify-between flex-shrink-0">
                      <div>
                        <h3 className="font-semibold text-xs">Pool</h3>
                        <p className="text-xs text-muted-foreground">Drag to schedule</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setPoolDrawerOpen(false)}
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <PoolSection onEdit={handleEditTemplate} />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 mt-2"
                      onClick={() => setPoolDrawerOpen(true)}
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Calendar View - Adjusts margin when drawer is open */}
              <div 
                className={cn(
                  "flex-1 overflow-hidden min-w-0 min-h-0 h-full transition-all duration-300",
                  poolDrawerOpen && "ml-64 sm:ml-72 md:ml-80"
                )}
              >
                <BentoBoxGanttView 
                  currentDate={currentDate} 
                  onEdit={handleEditTemplate}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Library, Template Builder & Template Editor */}
          {activeTab === 'builder' && (
            <div className="flex flex-1 overflow-hidden min-h-0 h-full">
              {/* Library Section */}
              <div className="w-full sm:w-64 md:w-80 lg:w-96 border-r flex-shrink-0 overflow-hidden h-full">
                <LibrarySection />
              </div>

              {/* Builder or Editor */}
              <div className="flex-1 overflow-hidden min-w-0 flex flex-col h-full min-h-0">
                {editingTemplateId ? (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <TemplateEditor
                      templateId={editingTemplateId}
                      onSave={handleSaveTemplate}
                      onCancel={handleCancelEdit}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto min-h-0">
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
          )}
        </div>
      </div>
    </div>
  );
}
