/**
 * BentoBox Calendar - Template Editor Component
 * 
 * Allows users to edit existing encounter templates by swapping atoms
 */

import React, { useState, useEffect } from 'react';
import { X, Save, GripVertical, Users, Clock, MapPin, User, Activity } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { Atom, EncounterTemplate, TemplateCategory } from './types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
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

interface TemplateEditorProps {
  templateId: string;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function TemplateEditor({ templateId, onSave, onCancel, className }: TemplateEditorProps) {
  const {
    library,
    getTemplateById,
    updateTemplate,
    updatePoolTemplate,
    updateScheduledEncounter,
  } = useBentoBoxStore();

  const template = getTemplateById(templateId);
  
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(
    template?.category || 'life-skills'
  );
  const [currentTemplate, setCurrentTemplate] = useState<Partial<EncounterTemplate>>({
    staff: template?.staff || [],
    activity: template?.activity,
    clients: template?.clients || [],
    location: template?.location,
    duration: template?.duration,
    category: template?.category,
  });

  // Update state when template changes
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setSelectedCategory(template.category);
      setCurrentTemplate({
        staff: template.staff || [],
        activity: template.activity,
        clients: template.clients || [],
        location: template.location,
        duration: template.duration,
        category: template.category,
      });
    }
  }, [template]);

  if (!template) {
    return (
      <div className={cn("p-4", className)}>
        <p className="text-sm text-muted-foreground">Template not found</p>
      </div>
    );
  }

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

    setCurrentTemplate(updated);
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

    setCurrentTemplate(updated);
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

    if (currentTemplate.clients?.length === 0) {
      alert('Please add at least one client or client group');
      return;
    }

    // Update the template
    updateTemplate(templateId, {
      name: templateName,
      description: templateDescription || undefined,
      staff: currentTemplate.staff || [],
      activity: currentTemplate.activity,
      clients: currentTemplate.clients || [],
      location: currentTemplate.location,
      duration: currentTemplate.duration,
      category: selectedCategory,
      rules: {
        clientCapacity: {
          min: 1,
          max: currentTemplate.clients?.reduce((count, c) => {
            if (c.type === 'client') return count + 1;
            if (c.type === 'client-group') return count + c.clientIds.length;
            return count;
          }, 0) || 10,
        },
      },
    });

    // Update pool template if it exists
    const state = useBentoBoxStore.getState();
    const poolTemplate = state.pool.find((p) => p.templateId === templateId);
    if (poolTemplate) {
      updatePoolTemplate(poolTemplate.id, {
        name: templateName,
        category: selectedCategory,
        quickInfo: {
          staffInitials: (currentTemplate.staff || [])
            .map(s => s.name.split(' ').map(n => n[0]).join(''))
            .join(', ') || 'N/A',
          activityCode: currentTemplate.activity?.name
            .split(' ')
            .map(w => w[0])
            .join('')
            .substring(0, 3)
            .toUpperCase() || 'N/A',
          clientCount: (currentTemplate.clients || []).reduce((count, c) => {
            if (c.type === 'client') return count + 1;
            if (c.type === 'client-group') return count + c.clientIds.length;
            return count;
          }, 0),
          duration: currentTemplate.duration?.label || 'N/A',
        },
      });
    }

    // Update scheduled encounters that use this template
    state.scheduledEncounters
      .filter((e) => e.templateId === templateId)
      .forEach((encounter) => {
        updateScheduledEncounter(encounter.id, {
          // Update encounter with new template data
          // The encounter will reflect the updated template
        });
      });

    if (onSave) {
      onSave();
    }
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
            ? "border-primary bg-primary/10"
            : "border-muted bg-muted/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-2">
            Drop {label.toLowerCase()} here
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center gap-2 p-2 bg-background rounded border text-sm"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">
                  {item.name || item.label || `${item.type} ${index + 1}`}
                </span>
                <button
                  onClick={() => onRemove(index, item.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("p-4 space-y-4 overflow-y-auto", className)}>
      <div>
        <h3 className="text-lg font-semibold mb-2">Edit Encounter Template</h3>
        <p className="text-sm text-muted-foreground">
          Swap items from the library to update this template.
        </p>
      </div>

      {/* Template Name & Description */}
      <div className="space-y-2">
        <div>
          <Label htmlFor="template-name">Template Name *</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Life-Skills Group"
          />
        </div>
        <div>
          <Label htmlFor="template-description">Description (optional)</Label>
          <Input
            id="template-description"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Brief description of this template"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategory} onValueChange={(value: TemplateCategory) => setSelectedCategory(value)}>
            <SelectTrigger id="category">
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
      <Card>
        <CardContent className="p-4 space-y-4">
          <DropZone
            id="staff"
            label="Drop Staff Here"
            icon={User}
            items={currentTemplate.staff || []}
            onRemove={(index) => handleRemoveAtom('staff', index)}
            accepts={['staff']}
          />

          <DropZone
            id="activity"
            label="Drop Activity Here"
            icon={Activity}
            items={currentTemplate.activity ? [currentTemplate.activity] : []}
            onRemove={() => handleRemoveAtom('activity')}
            accepts={['activity']}
          />

          <DropZone
            id="clients"
            label="Drop Clients/Client Groups Here"
            icon={Users}
            items={currentTemplate.clients || []}
            onRemove={(_, id) => handleRemoveAtom('clients', undefined, id)}
            accepts={['client', 'client-group']}
          />

          <DropZone
            id="location"
            label="Drop Location Here"
            icon={MapPin}
            items={currentTemplate.location ? [currentTemplate.location] : []}
            onRemove={() => handleRemoveAtom('location')}
            accepts={['location']}
          />

          <DropZone
            id="duration"
            label="Drop Duration Here"
            icon={Clock}
            items={currentTemplate.duration ? [currentTemplate.duration] : []}
            onRemove={() => handleRemoveAtom('duration')}
            accepts={['duration']}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSaveTemplate} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}















