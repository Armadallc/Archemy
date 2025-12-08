/**
 * BentoBox Calendar - Library Section Component
 * 
 * Displays all available atoms (Staff, Activities, Clients, etc.)
 * for use in Template Builder and Template Editor
 */

import React from 'react';
import { GripVertical } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { Atom } from './types';
import { cn } from '../../lib/utils';

interface LibrarySectionProps {
  className?: string;
}

export function LibrarySection({ className }: LibrarySectionProps) {
  const { library } = useBentoBoxStore();

  const handleDragStart = (e: React.DragEvent, atom: Atom) => {
    e.dataTransfer.setData('application/json', JSON.stringify(atom));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Library</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag atoms to builder
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Staff */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Staff
          </h4>
          <div className="space-y-2">
            {library.atoms.staff.map((staff) => (
              <div
                key={staff.id}
                draggable
                onDragStart={(e) => handleDragStart(e, staff)}
                className="p-2 rounded-md border bg-background cursor-move hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{staff.name}</div>
                    {staff.role && (
                      <div className="text-xs text-muted-foreground">{staff.role}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Encounter Type
          </h4>
          <div className="space-y-2">
            {library.atoms.activities.map((activity) => (
              <div
                key={activity.id}
                draggable
                onDragStart={(e) => handleDragStart(e, activity)}
                className="p-2 rounded-md border bg-background cursor-move hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  <div className="text-sm font-medium">{activity.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Clients
          </h4>
          <div className="space-y-2">
            {library.atoms.clients.map((client) => (
              <div
                key={client.id}
                draggable
                onDragStart={(e) => handleDragStart(e, client)}
                className="p-2 rounded-md border bg-background cursor-move hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  <div className="text-sm font-medium">{client.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Groups */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Client Groups
          </h4>
          <div className="space-y-2">
            {library.atoms.clientGroups.map((group) => (
              <div
                key={group.id}
                draggable
                onDragStart={(e) => handleDragStart(e, group)}
                className="p-2 rounded-md border bg-background cursor-move hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{group.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {group.clientIds.length} clients
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Locations
          </h4>
          <div className="space-y-2">
            {library.atoms.locations.map((location) => (
              <div
                key={location.id}
                draggable
                onDragStart={(e) => handleDragStart(e, location)}
                className="p-2 rounded-md border bg-background cursor-move hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  <div className="text-sm font-medium">{location.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Durations */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Duration
          </h4>
          <div className="space-y-2">
            {library.atoms.durations.map((duration) => (
              <div
                key={duration.id}
                draggable
                onDragStart={(e) => handleDragStart(e, duration)}
                className="p-2 rounded-md border bg-background cursor-move hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  <div className="text-sm font-medium">{duration.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



