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
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon, Settings } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { BentoBoxGanttView } from "../components/bentobox-calendar/BentoBoxGanttView";
import { StaffFilter } from "../components/bentobox-calendar/StaffFilter";

// Lazy load views to avoid loading when feature flags are disabled
const BentoBoxMonthView = React.lazy(async () => {
  const module = await import("../components/bentobox-calendar/views/BentoBoxMonthView");
  return { default: module.BentoBoxMonthView };
});

const BentoBoxAgendaView = React.lazy(async () => {
  const module = await import("../components/bentobox-calendar/views/BentoBoxAgendaView");
  return { default: module.BentoBoxAgendaView };
});
import { PoolSection } from "../components/bentobox-calendar/PoolSection";
import { LibrarySection } from "../components/bentobox-calendar/LibrarySection";
import { TemplateBuilder } from "../components/bentobox-calendar/TemplateBuilder";
import { TemplateEditor } from "../components/bentobox-calendar/TemplateEditor";
import { ClientGroupBuilder } from "../components/bentobox-calendar/ClientGroupBuilder";
import { useBentoBoxStore } from "../components/bentobox-calendar/store";
import { Button } from "../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Switch } from "../components/ui/switch";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { RollbackManager } from "../utils/rollback-manager";
// Removed Radix Tabs - using custom implementation for better layout control
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";
import { FEATURE_FLAGS } from "../lib/feature-flags";

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
    timeFormat,
    setTimeFormat,
    showConfirmationDialog,
    setShowConfirmationDialog,
    agendaGroupBy,
    setAgendaGroupBy,
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
      case "agenda":
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
      case "agenda":
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
      case "agenda":
        const agendaWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const agendaWeekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(agendaWeekStart, 'MMM d')} - ${format(agendaWeekEnd, 'MMM d, yyyy')}`;
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

        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex flex-1 flex-col overflow-hidden min-h-0 w-full">
          {/* Custom Tab Navigation */}
          <div 
            className="px-4 pt-4 pb-4 border flex-shrink-0 bg-background rounded-md mb-2"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(165, 200, 202, 1)',
              borderRadius: '6px'
            }}
          >
            <div className="flex items-center justify-between gap-4 min-w-0 w-full">
              <div className="flex items-center gap-4 flex-shrink-0">
              {/* Tab buttons - aligned with POOL button */}
              {/* Account for Pool Panel padding (p-4 = 16px) to align with POOL button */}
              <div 
                className="relative inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground flex-shrink-0 ml-4"
              >
                <button
                  onClick={() => setActiveTab('stage')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    activeTab === 'stage'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ 
                    fontSize: '23px',
                    borderRadius: '6px',
                    borderWidth: '1px',
                    borderColor: 'var(--border)',
                    marginLeft: '12px',
                    marginRight: '12px'
                  }}
                >
                  STAGE & CALENDAR
                </button>
                <button
                  onClick={() => setActiveTab('builder')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    activeTab === 'builder'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ 
                    fontSize: '23px',
                    borderRadius: '6px',
                    borderWidth: '1px',
                    borderColor: 'var(--border)',
                    marginLeft: '12px',
                    marginRight: '12px'
                  }}
                >
                  LIBRARY & BUILDER
                </button>
              </div>
              </div>
              
              <div 
                className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0 sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] rounded-md border"
                style={{
                  height: '49px',
                  borderRadius: '6px',
                  borderColor: 'var(--border)',
                  borderWidth: '1px',
                  paddingLeft: '12px',
                  paddingRight: '12px'
                }}
              >
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  style={{ height: '32px' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  style={{ height: '32px' }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  style={{ height: '32px' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* View Toggle - Icons only, text only for selected */}
              <div 
                className="flex items-center gap-1 rounded-md border border-border p-1"
                style={{
                  backgroundColor: 'unset',
                  borderStyle: 'solid',
                  height: '32px'
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("day")}
                  className={cn(
                    "h-8 px-2",
                    currentView === "day" 
                      ? "bg-background shadow-sm" 
                      : "hover:bg-muted"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  {currentView === "day" && <span className="ml-1.5">Day</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("week")}
                  className={cn(
                    "h-8 px-2",
                    currentView === "week" 
                      ? "bg-background shadow-sm" 
                      : "hover:bg-muted"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  {currentView === "week" && <span className="ml-1.5">Week</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("month")}
                  className={cn(
                    "h-8 px-2",
                    currentView === "month" 
                      ? "bg-background shadow-sm" 
                      : "hover:bg-muted"
                  )}
                >
                  <CalendarDays className="w-4 h-4" />
                  {currentView === "month" && <span className="ml-1.5">Month</span>}
                </Button>
                {(() => {
                  const isEnabled = FEATURE_FLAGS.FULL_CALENDAR_AGENDA_VIEW;
                  if (import.meta.env.DEV) {
                    console.log('🔍 Agenda View Button Debug:', {
                      isEnabled,
                      envValue: import.meta.env.VITE_ENABLE_AGENDA_VIEW,
                      featureFlag: FEATURE_FLAGS.FULL_CALENDAR_AGENDA_VIEW
                    });
                  }
                  return isEnabled;
                })() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('📅 Switching to Agenda view');
                      setCurrentView("agenda");
                    }}
                    className={cn(
                      "h-8 px-2",
                      currentView === "agenda" 
                        ? "bg-background shadow-sm" 
                        : "hover:bg-muted"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    {currentView === "agenda" && <span className="ml-1.5">Agenda</span>}
                  </Button>
                )}
              </div>
              
              {/* Staff Filter - Only show if feature flag enabled */}
              {FEATURE_FLAGS.FULL_CALENDAR_STAFF_FILTER && (
                <StaffFilter />
              )}
              
              {/* Settings Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Calendar Settings</h4>
                    </div>
                    
                    {/* Time Format Toggle */}
                    {FEATURE_FLAGS.FULL_CALENDAR_TIME_FORMAT && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="time-format" className="text-sm">
                          Use 24 hour format
                        </Label>
                        <Switch
                          id="time-format"
                          checked={timeFormat === "24h"}
                          onCheckedChange={(checked) => setTimeFormat(checked ? "24h" : "12h")}
                        />
                      </div>
                    )}
                    
                    {/* Show Confirmation Dialog Toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="confirmation-dialog" className="text-sm">
                        Show confirmation dialog on event drop
                      </Label>
                      <Switch
                        id="confirmation-dialog"
                        checked={showConfirmationDialog}
                        onCheckedChange={setShowConfirmationDialog}
                      />
                    </div>
                    
                    {/* Agenda View Group By */}
                    {FEATURE_FLAGS.FULL_CALENDAR_AGENDA_VIEW && (
                      <div className="space-y-2">
                        <Label className="text-sm">Agenda view group by</Label>
                        <RadioGroup
                          value={agendaGroupBy}
                          onValueChange={(value) => setAgendaGroupBy(value as "date" | "color" | "staff" | "category")}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="date" id="group-date" />
                            <Label htmlFor="group-date" className="text-sm font-normal cursor-pointer">
                              Date
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="color" id="group-color" />
                            <Label htmlFor="group-color" className="text-sm font-normal cursor-pointer">
                              Color
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="staff" id="group-staff" />
                            <Label htmlFor="group-staff" className="text-sm font-normal cursor-pointer">
                              Staff
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="category" id="group-category" />
                            <Label htmlFor="group-category" className="text-sm font-normal cursor-pointer">
                              Category
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            </div>
          </div>

          {/* Tab 1: Stage & Calendar */}
          {activeTab === 'stage' && (
            <div className="flex flex-1 overflow-hidden min-h-0 gap-6 py-4 px-0">
              {/* Pool Panel - Separate container with rounded corners and border */}
              <div 
                className={cn(
                  "bg-background border rounded-lg transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
                  poolDrawerOpen 
                    ? "w-64 sm:w-72 md:w-80 shadow-xl" 
                    : "w-12"
                )}
                style={{
                  backgroundColor: 'var(--card)'
                }}
              >
                {poolDrawerOpen ? (
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                        <button
                          className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "bg-background text-foreground shadow-sm"
                          )}
                          style={{ fontSize: '23px' }}
                        >
                          POOL
                        </button>
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
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="text-xs text-muted-foreground mb-2">Drag to schedule</div>
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

              {/* Calendar View - Separate container with rounded corners and border */}
              <div 
                className="flex-1 overflow-hidden min-w-0 min-h-0 flex flex-col bg-background border rounded-lg shadow-xl"
                style={{
                  backgroundColor: 'var(--card)'
                }}
              >
                {(() => {
                  // Month view
                  if (FEATURE_FLAGS.FULL_CALENDAR_MONTH_VIEW && currentView === 'month') {
                    return (
                      <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading month view...</div>}>
                        <BentoBoxMonthView 
                          currentDate={currentDate}
                          onDateChange={setCurrentDate}
                        />
                      </React.Suspense>
                    );
                  }
                  
                  // Agenda view
                  if (FEATURE_FLAGS.FULL_CALENDAR_AGENDA_VIEW && currentView === 'agenda') {
                    console.log('📅 Rendering Agenda View');
                    return (
                      <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading agenda view...</div>}>
                        <BentoBoxAgendaView 
                          currentDate={currentDate}
                          onDateChange={setCurrentDate}
                        />
                      </React.Suspense>
                    );
                  }
                  
                  // Debug: Log when agenda view should show but doesn't
                  if (currentView === 'agenda' && !FEATURE_FLAGS.FULL_CALENDAR_AGENDA_VIEW) {
                    console.warn('⚠️ Agenda view selected but feature flag is disabled');
                  }
                  
                  // Default: Gantt view (Day/Week)
                  return (
                    <BentoBoxGanttView 
                      currentDate={currentDate} 
                      onEdit={handleEditTemplate}
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tab 2: Library, Template Builder & Template Editor */}
          {activeTab === 'builder' && (
            <div className="flex flex-1 overflow-hidden min-h-0 gap-6 py-4 px-0">
              {/* Library Section - matches Pool Panel styling */}
              <div 
                className="w-full sm:w-64 md:w-80 lg:w-96 bg-background border rounded-lg flex-shrink-0 overflow-hidden h-full shadow-xl"
                style={{
                  backgroundColor: 'var(--card)'
                }}
              >
                <LibrarySection />
              </div>

              {/* Builder or Editor - matches Calendar View styling */}
              <div 
                className="flex-1 overflow-hidden min-w-0 flex flex-col h-full min-h-0 bg-background border rounded-lg shadow-xl"
                style={{
                  backgroundColor: 'var(--card)'
                }}
              >
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
