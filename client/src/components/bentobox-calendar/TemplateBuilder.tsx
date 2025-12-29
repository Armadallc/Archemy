/**
 * BentoBox Calendar - Template Builder Component
 * 
 * Allows users to build encounter templates by dragging atoms
 * into drop zones and combining them into complete templates.
 */

import React, { useState } from 'react';
import { Plus, X, Save, GripVertical, Users, Clock, MapPin, User, Activity } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { Atom, EncounterTemplate, TemplateCategory } from './types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface TemplateBuilderProps {
  className?: string;
  onClientGroupAdded?: (clientGroup: any) => void;
}

export function TemplateBuilder({ className, onClientGroupAdded }: TemplateBuilderProps) {
  const {
    library,
    builderTemplate,
    setBuilderTemplate,
    addTemplate,
    addToPool,
  } = useBentoBoxStore();

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('life-skills');
  
  // Initialize builder template if empty
  const currentTemplate = builderTemplate || {
    staff: [],
    activity: undefined,
    clients: [],
    location: undefined,
    duration: undefined,
    category: selectedCategory,
  };
  
  // Expose handler for ClientGroupBuilder to add groups to template
  const handleClientGroupAdded = React.useCallback((clientGroup: any) => {
    // Auto-generate name if blank
    let groupName = clientGroup.name;
    if (!groupName.trim() && templateName.trim()) {
      // Generate name from template name
      groupName = `${templateName.trim()} Client Group`;
    } else if (!groupName.trim()) {
      // Will be auto-named when template is saved
      groupName = ''; // Keep blank for now
    }

    // Update the client group name if needed
    const namedGroup = {
      ...clientGroup,
      name: groupName || clientGroup.name, // Use provided name or keep original
    };

    // Get current template from store
    const state = useBentoBoxStore.getState();
    const current = state.builderTemplate || {
      staff: [],
      activity: undefined,
      clients: [],
      location: undefined,
      duration: undefined,
      category: selectedCategory,
    };

    // Add to builder template
    const updated = { ...current };
    updated.clients = [...(updated.clients || []), namedGroup];
    setBuilderTemplate(updated);
  }, [templateName, selectedCategory, setBuilderTemplate]);

  const handleAtomDrop = (atom: Atom, dropZone: string) => {
    const updated = { ...currentTemplate };

    switch (dropZone) {
      case 'staff':
        if (atom.type === 'staff') {
          updated.staff = [...(updated.staff || []), atom];
        }
        break;
      case 'activity':
        if (atom.type === 'activity') {
          updated.activity = atom;
          updated.category = atom.category;
          setSelectedCategory(atom.category);
        }
        break;
      case 'clients':
        if (atom.type === 'client' || atom.type === 'client-group') {
          updated.clients = [...(updated.clients || []), atom];
        }
        break;
      case 'location':
        if (atom.type === 'location') {
          updated.location = atom;
        }
        break;
      case 'duration':
        if (atom.type === 'duration') {
          updated.duration = atom;
        }
        break;
    }

    setBuilderTemplate(updated);
  };

  const handleRemoveAtom = (type: string, index?: number, id?: string) => {
    const updated = { ...currentTemplate };

    switch (type) {
      case 'staff':
        if (index !== undefined) {
          updated.staff = updated.staff?.filter((_, i) => i !== index) || [];
        }
        break;
      case 'activity':
        updated.activity = undefined;
        break;
      case 'clients':
        if (id) {
          updated.clients = updated.clients?.filter((c) => c.id !== id) || [];
        }
        break;
      case 'location':
        updated.location = undefined;
        break;
      case 'duration':
        updated.duration = undefined;
        break;
    }

    setBuilderTemplate(updated);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!currentTemplate.activity) {
      alert('Please select an activity');
      return;
    }

    if (!currentTemplate.duration) {
      alert('Please select a duration');
      return;
    }

    if (currentTemplate.staff?.length === 0) {
      alert('Please add at least one staff member');
      return;
    }

    // Process client groups - auto-name any that don't have names
    // Note: clients are optional - templates can be saved without clients
    const processedClients = (currentTemplate.clients || []).map((c) => {
      if (c.type === 'client-group' && !c.name.trim()) {
        // Auto-generate name from template name
        const baseName = templateName.trim();
        // Extract letter/number suffix if present (e.g., "Life Skills A" -> "A")
        const match = baseName.match(/\s+([A-Z0-9]+)$/);
        const suffix = match ? match[1] : '';
        const groupName = suffix 
          ? `${baseName.replace(/\s+[A-Z0-9]+$/, '')} Client Group ${suffix}`
          : `${baseName} Client Group`;
        
        // Update the group in library
        const state = useBentoBoxStore.getState();
        const existingGroup = state.library.atoms.clientGroups.find(g => g.id === c.id);
        if (existingGroup) {
          state.updateAtom(c.id, { name: groupName }, 'client-group');
        }
        
        return {
          ...c,
          name: groupName,
        };
      }
      return c;
    });

    const newTemplate: Omit<EncounterTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      name: templateName,
      description: templateDescription || undefined,
      staff: currentTemplate.staff || [],
      activity: currentTemplate.activity,
      clients: processedClients,
      location: currentTemplate.location,
      duration: currentTemplate.duration,
      category: selectedCategory,
      rules: {
        clientCapacity: {
          min: processedClients.length > 0 ? 1 : 0,
          max: processedClients.reduce((count, c) => {
            if (c.type === 'client') return count + 1;
            if (c.type === 'client-group') return count + c.clientIds.length;
            return count;
          }, 0) || 10,
        },
      },
    };

    addTemplate(newTemplate);
    
    // Add to pool automatically
    const templates = useBentoBoxStore.getState().library.templates;
    const savedTemplate = templates[templates.length - 1];
    if (savedTemplate) {
      addToPool(savedTemplate.id);
    }

    // Reset builder
    setTemplateName('');
    setTemplateDescription('');
    setBuilderTemplate(undefined);
    setSelectedCategory('life-skills');

    alert('Template saved and added to pool!');
  };

  const DropZone = ({ 
    id, 
    label, 
    icon: Icon, 
    items, 
    onRemove,
    accepts 
  }: {
    id: string;
    label: string;
    icon: React.ElementType;
    items: any[];
    onRemove: (index?: number, itemId?: string) => void;
    accepts: string[];
  }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
      setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      
      const atomData = e.dataTransfer.getData('application/json');
      if (atomData) {
        try {
          const atom = JSON.parse(atomData);
          if (accepts.includes(atom.type)) {
            handleAtomDrop(atom, id);
          }
        } catch (error) {
          console.error('Error parsing dropped atom:', error);
        }
      }
    };

    return (
      <div
        className={cn(
          "min-h-[80px] p-3 rounded-lg border-2 border-dashed transition-colors",
          isDraggingOver
            ? "card-neu-pressed border-[#a5c8ca]"
            : "card-neu-flat border-dashed"
        )}
        style={{ 
          backgroundColor: 'var(--background)', 
          borderColor: isDraggingOver ? '#a5c8ca' : 'rgba(165, 200, 202, 0.3)'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
          <Label className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{label}</Label>
        </div>
        
        {items.length === 0 ? (
          <div className="text-xs text-center py-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Drop {label.toLowerCase()} here
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center gap-2 p-2 rounded card-neu-flat text-sm"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <GripVertical className="w-4 h-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
                <span className="flex-1" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                  {item.name || item.label || `${item.type} ${index + 1}`}
                </span>
                <button
                  onClick={() => onRemove(index, item.id)}
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
    );
  };

  return (
    <div className={cn("p-4 space-y-4", className)} style={{ paddingBottom: '16px' }}>
      <div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#a5c8ca' }}>BUILD ENCOUNTER TEMPLATE</h3>
        <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
          Drag atoms from the sidebar into the drop zones below to build your template.
        </p>
      </div>

      {/* Template Name & Description */}
      <div className="space-y-2">
        <div>
          <Label htmlFor="template-name" style={{ color: '#a5c8ca', opacity: 0.7 }}>Template Name *</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Life-Skills Group"
            className="card-neu-pressed"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        </div>
        <div>
          <Label htmlFor="template-description" style={{ color: '#a5c8ca', opacity: 0.7 }}>Description (optional)</Label>
          <Input
            id="template-description"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Brief description of this template"
            className="card-neu-pressed"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        </div>
        <div>
          <Label htmlFor="template-category" style={{ color: '#a5c8ca', opacity: 0.7 }}>Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value as TemplateCategory);
              setBuilderTemplate({ ...currentTemplate, category: value as TemplateCategory });
            }}
          >
            <SelectTrigger id="template-category" className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="life-skills">Life Skills</SelectItem>
              <SelectItem value="recreation">Recreation</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="administrative">Administrative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drop Zones */}
      <div className="space-y-3">
        <DropZone
          id="staff"
          label="Staff"
          icon={User}
          items={currentTemplate.staff || []}
          onRemove={(index) => handleRemoveAtom('staff', index)}
          accepts={['staff']}
        />

        <DropZone
          id="activity"
          label="Activity"
          icon={Activity}
          items={currentTemplate.activity ? [currentTemplate.activity] : []}
          onRemove={() => handleRemoveAtom('activity')}
          accepts={['activity']}
        />

        <DropZone
          id="clients"
          label="Clients / Client Groups (optional)"
          icon={Users}
          items={currentTemplate.clients || []}
          onRemove={(_, id) => handleRemoveAtom('clients', undefined, id)}
          accepts={['client', 'client-group']}
        />

        <DropZone
          id="location"
          label="Location (optional)"
          icon={MapPin}
          items={currentTemplate.location ? [currentTemplate.location] : []}
          onRemove={() => handleRemoveAtom('location')}
          accepts={['location']}
        />

        <DropZone
          id="duration"
          label="Duration"
          icon={Clock}
          items={currentTemplate.duration ? [currentTemplate.duration] : []}
          onRemove={() => handleRemoveAtom('duration')}
          accepts={['duration']}
        />
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '16px', marginBottom: '0' }}>
        <Button
          onClick={handleSaveTemplate}
          className="w-full card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
          disabled={
            !templateName.trim() ||
            !currentTemplate.activity ||
            !currentTemplate.duration ||
            (currentTemplate.staff?.length || 0) === 0
          }
        >
          <Save className="w-4 h-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Save Template & Add to Pool</span>
        </Button>
      </div>
    </div>
  );
}

