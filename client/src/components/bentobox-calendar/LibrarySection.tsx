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
      <div className="p-4 border-b flex items-center" style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
        <div className="inline-flex h-10 items-center justify-center rounded-md p-1">
          <button
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "card-neu-pressed [&]:shadow-none"
            )}
            style={{ fontSize: '23px', backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
          >
            LIBRARY
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Staff */}
        <div>
          <h4 className="text-xs font-medium mb-2 uppercase" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Staff
          </h4>
          <div className="space-y-2">
            {library.atoms.staff.map((staff) => (
              <div
                key={staff.id}
                draggable
                onDragStart={(e) => handleDragStart(e, staff)}
                className="p-2 rounded-md card-neu-flat cursor-move hover:card-neu transition-colors"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{staff.name}</div>
                    {staff.role && (
                      <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>{staff.role}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div>
          <h4 className="text-xs font-medium mb-2 uppercase" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Encounter Type
          </h4>
          <div className="space-y-2">
            {library.atoms.activities.map((activity) => (
              <div
                key={activity.id}
                draggable
                onDragStart={(e) => handleDragStart(e, activity)}
                className="p-2 rounded-md card-neu-flat cursor-move hover:card-neu transition-colors"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                  <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{activity.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div>
          <h4 className="text-xs font-medium mb-2 uppercase" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Clients
          </h4>
          <div className="space-y-2">
            {library.atoms.clients.map((client) => (
              <div
                key={client.id}
                draggable
                onDragStart={(e) => handleDragStart(e, client)}
                className="p-2 rounded-md card-neu-flat cursor-move hover:card-neu transition-colors"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                  <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{client.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Groups */}
        <div>
          <h4 className="text-xs font-medium mb-2 uppercase" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Client Groups
          </h4>
          <div className="space-y-2">
            {library.atoms.clientGroups.map((group) => (
              <div
                key={group.id}
                draggable
                onDragStart={(e) => handleDragStart(e, group)}
                className="p-2 rounded-md card-neu-flat cursor-move hover:card-neu transition-colors"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{group.name}</div>
                    <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
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
          <h4 className="text-xs font-medium mb-2 uppercase" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Locations
          </h4>
          <div className="space-y-2">
            {library.atoms.locations.map((location) => (
              <div
                key={location.id}
                draggable
                onDragStart={(e) => handleDragStart(e, location)}
                className="p-2 rounded-md card-neu-flat cursor-move hover:card-neu transition-colors"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                  <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{location.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Durations */}
        <div>
          <h4 className="text-xs font-medium mb-2 uppercase" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Duration
          </h4>
          <div className="space-y-2">
            {library.atoms.durations.map((duration) => (
              <div
                key={duration.id}
                draggable
                onDragStart={(e) => handleDragStart(e, duration)}
                className="p-2 rounded-md card-neu-flat cursor-move hover:card-neu transition-colors"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                  <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{duration.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}















