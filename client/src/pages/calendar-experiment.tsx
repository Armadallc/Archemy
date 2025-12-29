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
    <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '24px' }}>
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!ENABLE_UNIFIED_HEADER && (
        <div className="flex-shrink-0 mb-6">
          <div className="px-6 py-6 rounded-lg card-neu flex items-center justify-between" style={{ backgroundColor: 'var(--background)', height: '150px' }}>
            <div className="flex items-end gap-6">
            <h1 
              className="font-bold" 
              style={{ 
                fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                fontSize: '110px',
                lineHeight: 1,
                fontWeight: 700,
                color: '#a5c8ca'
              }}
            >
              bentobox.
            </h1>
            <div 
              className="font-medium"
              style={{ 
                fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                fontSize: '48px',
                lineHeight: 1.3,
                color: '#a5c8ca',
                opacity: 0.8
              }}
            >
              {getDateRangeLabel()}
            </div>
            </div>
          
            <div className="flex items-center gap-6">
              {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                <HeaderScopeSelector />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-visible min-h-0" style={{ padding: '8px', margin: '-8px' }}>
        <div className="flex flex-1 flex-col overflow-visible min-h-0 w-full">
          {/* Custom Tab Navigation */}
          <div 
            className="px-6 pt-6 pb-6 flex-shrink-0 bg-background rounded-md mb-6 card-neu"
            style={{
              backgroundColor: 'var(--background)',
              borderRadius: '6px',
              overflow: 'visible'
            }}
          >
            <div className="flex items-center justify-between gap-6 min-w-0 w-full" style={{ padding: '8px' }}>
              <div className="flex items-center gap-6 flex-shrink-0 min-w-0">
              {/* Tab buttons - aligned with POOL button */}
              {/* Account for Pool Panel padding (p-4 = 16px) to align with POOL button */}
              <div 
                className="relative inline-flex h-10 items-center justify-center rounded-md p-1 flex-shrink-0 ml-4"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <button
                  onClick={() => setActiveTab('stage')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 font-medium transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    activeTab === 'stage'
                      ? "card-neu-pressed"
                      : "hover:card-neu"
                  )}
                  style={{ 
                    fontSize: '23px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--background)',
                    border: 'none',
                    color: '#a5c8ca',
                    marginLeft: '4px',
                    marginRight: '4px'
                  }}
                >
                  STAGE & CALENDAR
                </button>
                <button
                  onClick={() => setActiveTab('builder')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 font-medium transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    activeTab === 'builder'
                      ? "card-neu-pressed"
                      : "hover:card-neu"
                  )}
                  style={{ 
                    fontSize: '23px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--background)',
                    border: 'none',
                    color: '#a5c8ca',
                    marginLeft: '4px',
                    marginRight: '4px'
                  }}
                >
                  LIBRARY & BUILDER
                </button>
              </div>
              </div>
              
              <div
                className="flex items-center gap-4 flex-shrink min-w-0 rounded-md card-neu overflow-visible"
                style={{
                  height: '93px',
                  borderRadius: '6px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  backgroundColor: 'var(--background)'
                }}
              >
              {/* Date Navigation */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ height: '32px', width: '32px', padding: 0, backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToday}
                  className="card-neu-flat hover:card-neu [&]:shadow-none px-3"
                  style={{ height: '32px', backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <span style={{ color: '#a5c8ca' }}>Today</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ height: '32px', width: '32px', padding: 0, backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                </Button>
              </div>
              
              {/* View Toggle - Icons only, text only for selected */}
              <div 
                className="flex items-center gap-1 rounded-md card-neu-flat p-1 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--background)',
                  height: '32px'
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("day")}
                  className={cn(
                    "h-7 px-2 min-w-[32px] [&]:shadow-none",
                    currentView === "day" 
                      ? "card-neu-pressed" 
                      : "card-neu-flat hover:card-neu"
                  )}
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <Calendar className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                  {currentView === "day" && <span className="ml-1.5 text-xs" style={{ color: '#a5c8ca' }}>Day</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("week")}
                  className={cn(
                    "h-7 px-2 min-w-[32px] [&]:shadow-none",
                    currentView === "week" 
                      ? "card-neu-pressed" 
                      : "card-neu-flat hover:card-neu"
                  )}
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <LayoutGrid className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                  {currentView === "week" && <span className="ml-1.5 text-xs" style={{ color: '#a5c8ca' }}>Week</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("month")}
                  className={cn(
                    "h-7 px-2 min-w-[32px] [&]:shadow-none",
                    currentView === "month" 
                      ? "card-neu-pressed" 
                      : "card-neu-flat hover:card-neu"
                  )}
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <CalendarDays className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                  {currentView === "month" && <span className="ml-1.5 text-xs" style={{ color: '#a5c8ca' }}>Month</span>}
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
                      "h-7 px-2 min-w-[32px] [&]:shadow-none",
                      currentView === "agenda" 
                        ? "card-neu-pressed" 
                        : "card-neu-flat hover:card-neu"
                    )}
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    <LayoutGrid className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                    {currentView === "agenda" && <span className="ml-1.5 text-xs" style={{ color: '#a5c8ca' }}>Agenda</span>}
                  </Button>
                )}
              </div>
              
              {/* Staff Filter - Only show if feature flag enabled */}
              {FEATURE_FLAGS.FULL_CALENDAR_STAFF_FILTER && (
                <div className="flex-shrink-0">
                  <StaffFilter />
                </div>
              )}
              
              {/* Settings Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0 card-neu-flat hover:card-neu [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    <Settings className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }} align="end">
                  <div className="space-y-6">
                    <div className="space-y-6">
                      <h4 className="font-medium text-sm" style={{ color: '#a5c8ca' }}>CALENDAR SETTINGS</h4>
                    </div>
                    
                    {/* Time Format Toggle */}
                    {FEATURE_FLAGS.FULL_CALENDAR_TIME_FORMAT && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="time-format" className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>
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
                      <Label htmlFor="confirmation-dialog" className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>
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
                      <div className="space-y-6">
                        <Label className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>Agenda view group by</Label>
                        <RadioGroup
                          value={agendaGroupBy}
                          onValueChange={(value) => setAgendaGroupBy(value as "date" | "color" | "staff" | "category")}
                        >
                          <div className="flex items-center space-x-6">
                            <RadioGroupItem value="date" id="group-date" />
                            <Label htmlFor="group-date" className="text-sm font-normal cursor-pointer" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                              Date
                            </Label>
                          </div>
                          <div className="flex items-center space-x-6">
                            <RadioGroupItem value="color" id="group-color" />
                            <Label htmlFor="group-color" className="text-sm font-normal cursor-pointer" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                              Color
                            </Label>
                          </div>
                          <div className="flex items-center space-x-6">
                            <RadioGroupItem value="staff" id="group-staff" />
                            <Label htmlFor="group-staff" className="text-sm font-normal cursor-pointer" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                              Staff
                            </Label>
                          </div>
                          <div className="flex items-center space-x-6">
                            <RadioGroupItem value="category" id="group-category" />
                            <Label htmlFor="group-category" className="text-sm font-normal cursor-pointer" style={{ color: '#a5c8ca', opacity: 0.8 }}>
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
            <div className="flex flex-1 overflow-visible min-h-0 gap-6 pt-0 pb-6 px-0">
              {/* Pool Panel - Separate container with rounded corners and border */}
              <div 
                className={cn(
                  "bg-background rounded-lg transition-all duration-300 ease-in-out overflow-visible flex-shrink-0",
                  poolDrawerOpen 
                    ? "w-64 sm:w-72 md:w-80 card-neu" 
                    : "w-12"
                )}
                style={{
                  backgroundColor: 'var(--background)',
                  overflow: 'visible'
                }}
              >
                {poolDrawerOpen ? (
                  <div className="h-full flex flex-col overflow-hidden rounded-lg">
                    <div className="p-6 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(165, 200, 202, 0.2)' }}>
                      <button
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 font-medium transition-all h-12",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "card-neu-pressed [&]:shadow-none"
                        )}
                        style={{ fontSize: '23px', backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                      >
                        POOL
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 card-neu-flat hover:card-neu [&]:shadow-none"
                        style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        onClick={() => setPoolDrawerOpen(false)}
                      >
                        <ChevronLeftIcon className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="text-xs mb-6" style={{ color: '#a5c8ca', opacity: 0.7 }}>Drag to schedule</div>
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
                className="flex-1 overflow-visible min-w-0 min-h-0 flex flex-col bg-background rounded-lg card-neu"
                  style={{
                    backgroundColor: 'var(--background)',
                    overflow: 'visible'
                  }}
              >
                <div className="flex-1 overflow-hidden min-h-0 rounded-lg">
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
            </div>
          )}

          {/* Tab 2: Library, Template Builder & Template Editor */}
          {activeTab === 'builder' && (
            <div className="flex flex-1 overflow-hidden min-h-0 gap-6 pt-0 pb-6 px-0">
              {/* Library Section - matches Pool Panel styling */}
              <div 
                className="w-full sm:w-64 md:w-80 lg:w-96 bg-background rounded-lg flex-shrink-0 overflow-hidden h-full card-neu"
                  style={{
                    backgroundColor: 'var(--background)'
                  }}
              >
                <LibrarySection />
              </div>

              {/* Builder or Editor - matches Calendar View styling */}
              <div 
                className="flex-1 overflow-hidden min-w-0 flex flex-col h-full min-h-0 bg-background rounded-lg card-neu"
                  style={{
                    backgroundColor: 'var(--background)'
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
                    <div className="flex-shrink-0 overflow-visible" style={{ paddingBottom: '0' }}>
                      <TemplateBuilder />
                    </div>
                    <div className="flex-shrink-0 border-t bg-background" style={{ marginTop: '0' }}>
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
