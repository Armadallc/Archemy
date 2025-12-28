/**
 * BentoBox Calendar - Client Group Builder Component
 * 
 * Allows users to build client groups by dragging individual clients
 * and either save to pool or add to encounter template
 */

import React, { useState } from 'react';
import { Users, X, Save, Plus, GripVertical } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { ClientAtom, ClientGroupAtom } from './types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

interface ClientGroupBuilderProps {
  onAddToTemplate?: (clientGroup: ClientGroupAtom) => void;
  className?: string;
}

export function ClientGroupBuilder({ onAddToTemplate, className }: ClientGroupBuilderProps) {
  const { library, addAtom, addClientGroupToPool } = useBentoBoxStore();
  const [selectedClients, setSelectedClients] = useState<ClientAtom[]>([]);
  const [groupName, setGroupName] = useState('');

  const handleClientDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const atomData = e.dataTransfer.getData('application/json');
    if (atomData) {
      try {
        const atom = JSON.parse(atomData);
        if (atom.type === 'client') {
          // Check if client is already in the group
          if (!selectedClients.find(c => c.id === atom.id)) {
            setSelectedClients([...selectedClients, atom]);
          }
        }
      } catch (error) {
        console.error('Error parsing dropped client:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveClient = (clientId: string) => {
    setSelectedClients(selectedClients.filter(c => c.id !== clientId));
  };

  const handleSaveToPool = () => {
    if (selectedClients.length === 0) {
      alert('Please add at least one client to the group');
      return;
    }

    if (!groupName.trim()) {
      alert('Please enter a name for the client group');
      return;
    }

    // Create client group atom
    const clientGroup: ClientGroupAtom = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: groupName.trim(),
      clientIds: selectedClients.map(c => c.id),
      type: 'client-group',
    };

    // Add to library
    addAtom(clientGroup, 'client-group');

    // Add to pool
    addClientGroupToPool(clientGroup.id);
    
    // Reset
    setSelectedClients([]);
    setGroupName('');
    
    alert(`Client group "${clientGroup.name}" saved to library and pool!`);
  };

  const handleAddToTemplate = () => {
    if (selectedClients.length === 0) {
      alert('Please add at least one client to the group');
      return;
    }

    // Create client group atom (name will be auto-generated if blank when template is saved)
    const clientGroup: ClientGroupAtom = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: groupName.trim() || '', // Will be auto-generated if blank when template is saved
      clientIds: selectedClients.map(c => c.id),
      type: 'client-group',
    };

    // Add to library first (so it exists when template is saved)
    addAtom(clientGroup, 'client-group');

    // Pass to template builder
    if (onAddToTemplate) {
      onAddToTemplate(clientGroup);
    }

    // Reset
    setSelectedClients([]);
    setGroupName('');
  };

  return (
    <div className={cn("p-4 space-y-4 border-t card-neu-flat", className)} style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(165, 200, 202, 0.2)' }}>
      <div>
        <h3 className="text-base font-semibold mb-1" style={{ color: '#a5c8ca' }}>BUILD CLIENT GROUP</h3>
        <p className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
          Drag clients from library to form a group
        </p>
      </div>

      {/* Drop Zone */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="p-4">
          <div
            className={cn(
              "min-h-[120px] p-3 rounded-lg border-2 border-dashed transition-colors",
              "card-neu-flat"
            )}
            style={{ 
              backgroundColor: 'var(--background)', 
              borderColor: 'rgba(165, 200, 202, 0.3)',
              borderStyle: 'dashed'
            }}
            onDragOver={handleDragOver}
            onDrop={handleClientDrop}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
              <Label className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>Drop Clients Here</Label>
            </div>
            
            {selectedClients.length === 0 ? (
              <div className="text-xs text-center py-4" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                Drag clients from library to build group
              </div>
            ) : (
              <div className="space-y-2">
                {selectedClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-2 p-2 rounded card-neu-flat text-sm"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                    <span className="flex-1" style={{ color: '#a5c8ca', opacity: 0.8 }}>{client.name}</span>
                    <button
                      onClick={() => handleRemoveClient(client.id)}
                      className="card-neu-flat hover:card-neu [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    >
                      <X className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Group Name */}
      <div>
        <Label htmlFor="group-name" style={{ color: '#a5c8ca', opacity: 0.7 }}>Client Group Name (optional)</Label>
        <Input
          id="group-name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Group A (auto-generated if blank when adding to template)"
          className="card-neu-pressed"
          style={{ backgroundColor: 'var(--background)', border: 'none' }}
        />
        <p className="text-xs mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
          Leave blank when adding to template to auto-generate from template name
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleAddToTemplate}
          variant="outline"
          className="flex-1 card-neu-flat hover:card-neu [&]:shadow-none"
          style={{ backgroundColor: 'var(--background)', border: 'none' }}
          disabled={selectedClients.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" style={{ color: '#a5c8ca' }} />
          <span style={{ color: '#a5c8ca' }}>Add to Template</span>
        </Button>
        <Button
          onClick={handleSaveToPool}
          className="flex-1 card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
          disabled={selectedClients.length === 0 || !groupName.trim()}
        >
          <Save className="w-4 h-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Save to Pool</span>
        </Button>
      </div>
    </div>
  );
}

