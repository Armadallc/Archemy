/**
 * BentoBox Calendar - Sidebar Component
 * 
 * Restructured to allow Library and Builder to be accessible simultaneously:
 * - Main sidebar: Navigation, Library Atoms, Pool
 * - Builder panel: Overlays or side-by-side when active
 * - Auto-collapse sections when builder is active
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Library, 
  Wrench, 
  Droplets,
  ChevronDown,
  ChevronUp,
  Plus,
  GripVertical,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useBentoBoxStore } from './store';
import { SidebarSection, TemplateCategory, CATEGORY_COLORS, Atom } from './types';
import { TemplateBuilder } from './TemplateBuilder';
import { AddActivityDialog } from './AddActivityDialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface BentoBoxSidebarProps {
  className?: string;
}

export function BentoBoxSidebar({ className }: BentoBoxSidebarProps) {
  const {
    activeSidebarSection,
    setActiveSidebarSection,
    library,
    pool,
    addToPool,
    removeFromPool,
  } = useBentoBoxStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    navigation: true,
    library: true, // Library atoms always visible when builder is active
    pool: true,
  });

  // Auto-collapse navigation and pool when builder is active
  useEffect(() => {
    if (activeSidebarSection === 'builder') {
      setExpandedSections((prev) => ({
        ...prev,
        navigation: false,
        pool: false,
        library: true, // Keep library open
      }));
    }
  }, [activeSidebarSection]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      coral: 'bg-[#ff8475]/20 text-[#ff8475] border-[#ff8475]/30',
      lime: 'bg-[#f1fec9]/40 text-[#26282b] border-[#f1fec9]/50',
      ice: 'bg-[#e8fffe]/40 text-[#26282b] border-[#e8fffe]/50',
      charcoal: 'bg-[#26282b]/20 text-[#26282b] border-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
      silver: 'bg-[#eaeaea]/40 text-[#26282b] border-[#eaeaea]/50',
    };
    return colorMap[color] || colorMap.silver;
  };

  const handleDragStart = (e: React.DragEvent, atom: Atom) => {
    e.dataTransfer.setData('application/json', JSON.stringify(atom));
    e.dataTransfer.effectAllowed = 'move';
  };

  const isBuilderActive = activeSidebarSection === 'builder';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Sidebar */}
      <div className={cn(
        "border-r bg-background flex flex-col h-full overflow-hidden transition-all duration-300",
        isBuilderActive ? "w-64" : "w-80",
        className
      )}>
        {/* Navigation Section */}
        <div className="border-b flex-shrink-0">
          <button
            onClick={() => toggleSection('navigation')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-medium">Navigation</span>
            </div>
            {expandedSections.navigation ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.navigation && (
            <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Saved Templates
              </div>
              {library.templates.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  <Library className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No templates yet</p>
                  <p className="text-xs mt-1">Build a template to get started</p>
                </div>
              ) : (
                library.templates.map((template) => {
                  const isInPool = pool.some((p) => p.templateId === template.id);
                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        "p-3 cursor-pointer hover:shadow-md transition-shadow",
                        getColorClasses(template.color),
                        isInPool && "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        if (!isInPool) {
                          addToPool(template.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {template.staff.map((s) => s.name).join(', ')} • {template.activity.name}
                          </div>
                        </div>
                        {isInPool && (
                          <div className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">
                            In Pool
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Library Atoms Section - Always accessible when builder is active */}
        <div className="border-b flex-1 overflow-hidden flex flex-col">
          <button
            onClick={() => toggleSection('library')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              <span className="font-medium">Library</span>
            </div>
            {expandedSections.library ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.library && (
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
              {/* Staff Molecules */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Staff</h4>
                <div className="space-y-1">
                  {library.atoms.staff.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, staff)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{staff.name}</span>
                      {staff.role && (
                        <span className="text-xs text-muted-foreground ml-auto">{staff.role}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Molecules */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Activities</h4>
                  <AddActivityDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="w-3 h-3" />
                      </Button>
                    }
                  />
                </div>
                <div className="space-y-1">
                  {library.atoms.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-move",
                        getColorClasses(CATEGORY_COLORS[activity.category])
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, activity)}
                    >
                      <GripVertical className="w-4 h-4" />
                      <span className="text-sm font-medium">{activity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clients */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Clients</h4>
                <div className="space-y-1">
                  {library.atoms.clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, client)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{client.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Groups */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Client Groups</h4>
                <div className="space-y-1">
                  {library.atoms.clientGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, group)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{group.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {group.clientIds.length} clients
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Locations</h4>
                <div className="space-y-1">
                  {library.atoms.locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, location)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{location.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Durations */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Durations</h4>
                <div className="space-y-1">
                  {library.atoms.durations.map((duration) => (
                    <div
                      key={duration.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, duration)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{duration.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pool Section */}
        <div className="border-t flex-shrink-0">
          <button
            onClick={() => toggleSection('pool')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              <span className="font-medium">Pool</span>
              {pool.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {pool.length}
                </span>
              )}
            </div>
            {expandedSections.pool ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.pool && (
            <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
              {pool.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  <Droplets className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No templates in pool</p>
                  <p className="text-xs mt-1">Build templates to add them here</p>
                </div>
              ) : (
                pool.map((poolTemplate) => (
                  <Card
                    key={poolTemplate.id}
                    className={cn(
                      "cursor-move hover:shadow-md transition-shadow",
                      getColorClasses(poolTemplate.color)
                    )}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'pool-template',
                        poolId: poolTemplate.id,
                        templateId: poolTemplate.templateId,
                      }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">{poolTemplate.name}</CardTitle>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPool(poolTemplate.id);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <div>Staff: {poolTemplate.quickInfo.staffInitials}</div>
                        <div>Activity: {poolTemplate.quickInfo.activityCode}</div>
                        <div>Clients: {poolTemplate.quickInfo.clientCount}</div>
                        <div>Duration: {poolTemplate.quickInfo.duration}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Builder Toggle Button */}
        {!isBuilderActive && (
          <div className="border-t p-4">
            <Button
              onClick={() => setActiveSidebarSection('builder')}
              className="w-full"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              Build Template
            </Button>
          </div>
        )}
      </div>

      {/* Builder Panel - Slides in when active */}
      {isBuilderActive && (
        <div className={cn(
          "border-r bg-background flex flex-col h-full overflow-hidden transition-all duration-300",
          "w-96" // Fixed width for builder
        )}>
          <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span className="font-medium">Template Builder</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSidebarSection('navigation')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TemplateBuilder />
          </div>
        </div>
      )}
    </div>
  );
}
