/**
 * BentoBox Calendar - Library Section Component
 * 
 * Displays all atoms (Staff, Activities, Clients, etc.) for Tab 2
 */

import React, { useState } from 'react';
import { Library, ChevronDown, ChevronUp, GripVertical, Plus } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { Atom, TemplateCategory, CATEGORY_COLORS } from './types';
import { Button } from '../ui/button';
import { AddActivityDialog } from './AddActivityDialog';
import { cn } from '../../lib/utils';

interface LibrarySectionProps {
  className?: string;
}

export function LibrarySection({ className }: LibrarySectionProps) {
  const {
    library,
  } = useBentoBoxStore();

  const [expanded, setExpanded] = useState(true);

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

  const handleDragStart = (e: React.DragEvent, atom: Atom) => {
    e.dataTransfer.setData('application/json', JSON.stringify(atom));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={cn("border-b flex-1 overflow-hidden flex flex-col", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4" />
          <span className="font-medium">Library</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {expanded && (
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
  );
}

