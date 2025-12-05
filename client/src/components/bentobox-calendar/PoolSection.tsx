/**
 * BentoBox Calendar - Pool Section Component
 * 
 * Displays templates in the pool with hover cards for Edit/Delete actions
 */

import React, { useState } from 'react';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { PoolTemplate } from './types';
import { Button } from '../ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { cn } from '../../lib/utils';

interface PoolSectionProps {
  onEdit?: (templateId: string) => void;
  className?: string;
}

export function PoolSection({ onEdit, className }: PoolSectionProps) {
  const { pool, removeFromPool, library } = useBentoBoxStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ [key: string]: 'above' | 'right' }>({});
  const [isDragging, setIsDragging] = useState(false);

  const handleDelete = (poolTemplate: PoolTemplate) => {
    if (confirm(`Delete template "${poolTemplate.name}" from pool?`)) {
      removeFromPool(poolTemplate.id);
    }
  };

  const handleEdit = (templateId: string) => {
    if (onEdit) {
      onEdit(templateId);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      coral: 'bg-[#ff555d]/20 text-[#ff555d] border-[#ff555d]/30',
      lime: 'bg-[#f1fec9]/40 text-[#26282b] border-[#f1fec9]/50',
      ice: 'bg-[#e8fffe]/40 text-[#26282b] border-[#e8fffe]/50',
      charcoal: 'bg-[#26282b]/20 text-[#26282b] border-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
      silver: 'bg-[#eaeaea]/40 text-[#26282b] border-[#eaeaea]/50',
    };
    return colorMap[color] || colorMap.silver;
  };

  const handleDragStart = (e: React.DragEvent, poolTemplate: PoolTemplate) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsDragging(true);
    setHoveredId(null); // Hide all hover cards when dragging starts
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pool-template',
      templateId: poolTemplate.templateId,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };


  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Stage (Pool)</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag templates to calendar to schedule
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Encounter Templates */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Encounter Templates
          </h4>
          <div className="space-y-2">
            {pool
              .filter((p) => {
                const template = library.templates.find((t) => t.id === p.templateId);
                return template; // Only show if template exists (not client groups)
              })
              .map((poolTemplate) => {
                const template = library.templates.find((t) => t.id === poolTemplate.templateId);
                if (!template) return null;

                return (
                  <HoverCard key={poolTemplate.id} open={hoveredId === poolTemplate.id}>
                    <HoverCardTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, poolTemplate);
                        }}
                        onDragEnd={handleDragEnd}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredId(poolTemplate.id);
                            // Check if there's enough space above
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceAbove = rect.top;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            // If less than 200px above, show to the right
                            if (spaceAbove < 200) {
                              setHoverPosition(prev => ({ ...prev, [poolTemplate.id]: 'right' }));
                            } else {
                              setHoverPosition(prev => ({ ...prev, [poolTemplate.id]: 'above' }));
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isDragging) {
                            setHoveredId(null);
                          }
                        }}
                        className={cn(
                          "group relative p-3 rounded-md border cursor-move transition-all",
                          getColorClasses(poolTemplate.color),
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 mt-0.5 opacity-50" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{poolTemplate.name}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {poolTemplate.quickInfo.duration} • {poolTemplate.quickInfo.staffInitials}
                            </div>
                          </div>
                        </div>

                        {/* Hover Card Content */}
                        {hoveredId === poolTemplate.id && !isDragging && (
                          <div 
                            className={cn(
                              "absolute p-2 border rounded-md shadow-lg z-50 w-64",
                              "bg-popover text-popover-foreground pointer-events-auto",
                              "!bg-popover !opacity-100",
                              hoverPosition[poolTemplate.id] === 'right'
                                ? "left-full top-0 ml-1"
                                : "bottom-full left-0 right-0 mb-1"
                            )}
                            style={{ backgroundColor: 'var(--popover)', opacity: 1 }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <div className="text-xs space-y-1">
                                <div><strong>Staff:</strong> {template.staff.map(s => s.name).join(', ')}</div>
                                <div><strong>Activity:</strong> {template.activity.name}</div>
                                <div><strong>Clients:</strong> {poolTemplate.quickInfo.clientCount}</div>
                                <div><strong>Duration:</strong> {poolTemplate.quickInfo.duration}</div>
                                {template.location && (
                                  <div><strong>Location:</strong> {template.location.name}</div>
                                )}
                              </div>
                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(poolTemplate.templateId);
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(poolTemplate);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </HoverCardTrigger>
                  </HoverCard>
                );
              })}
          </div>
        </div>

        {/* Client Groups */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Client Groups
          </h4>
          <div className="space-y-2">
            {pool
              .filter((p) => {
                // Check if this is a client group (not a template)
                const template = library.templates.find((t) => t.id === p.templateId);
                const clientGroup = library.atoms.clientGroups.find((g) => g.id === p.templateId);
                return !template && clientGroup; // Show if it's a client group, not a template
              })
              .map((poolTemplate) => {
                const clientGroup = library.atoms.clientGroups.find((g) => g.id === poolTemplate.templateId);
                if (!clientGroup) return null;

                return (
                  <HoverCard key={poolTemplate.id} open={hoveredId === poolTemplate.id}>
                    <HoverCardTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setIsDragging(true);
                          setHoveredId(null); // Hide all hover cards when dragging starts
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'client-group',
                            clientGroupId: clientGroup.id,
                          }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={handleDragEnd}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredId(poolTemplate.id);
                            // Check if there's enough space above
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceAbove = rect.top;
                            // If less than 200px above, show to the right
                            if (spaceAbove < 200) {
                              setHoverPosition(prev => ({ ...prev, [poolTemplate.id]: 'right' }));
                            } else {
                              setHoverPosition(prev => ({ ...prev, [poolTemplate.id]: 'above' }));
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isDragging) {
                            setHoveredId(null);
                          }
                        }}
                        className={cn(
                          "group relative p-3 rounded-md border cursor-move transition-all",
                          getColorClasses(poolTemplate.color),
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 mt-0.5 opacity-50" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{poolTemplate.name}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {poolTemplate.quickInfo.clientCount} clients
                            </div>
                          </div>
                        </div>

                        {/* Hover Card Content */}
                        {hoveredId === poolTemplate.id && !isDragging && (
                          <div 
                            className={cn(
                              "absolute p-2 border rounded-md shadow-lg z-50 w-64",
                              "bg-popover text-popover-foreground pointer-events-auto",
                              "!bg-popover !opacity-100",
                              hoverPosition[poolTemplate.id] === 'right'
                                ? "left-full top-0 ml-1"
                                : "bottom-full left-0 right-0 mb-1"
                            )}
                            style={{ backgroundColor: 'var(--popover)', opacity: 1 }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <div className="text-xs space-y-1">
                                <div><strong>Name:</strong> {clientGroup.name}</div>
                                <div><strong>Clients:</strong> {poolTemplate.quickInfo.clientCount}</div>
                                <div className="text-xs text-muted-foreground">
                                  Drag to calendar encounter to add/replace clients
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(poolTemplate);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </HoverCardTrigger>
                  </HoverCard>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

