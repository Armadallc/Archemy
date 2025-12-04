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
}

export function TemplateBuilder({ className }: TemplateBuilderProps) {
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

    if (currentTemplate.clients?.length === 0) {
      alert('Please add at least one client or client group');
      return;
    }

    const newTemplate: Omit<EncounterTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
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
        <h3 className="text-lg font-semibold mb-2">Build Encounter Template</h3>
        <p className="text-sm text-muted-foreground">
          Drag atoms from the sidebar into the drop zones below to build your template.
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
          <Label htmlFor="template-category">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value as TemplateCategory);
              setBuilderTemplate({ ...currentTemplate, category: value as TemplateCategory });
            }}
          >
            <SelectTrigger id="template-category">
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
          label="Clients / Client Groups"
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
      <Button
        onClick={handleSaveTemplate}
        className="w-full"
        disabled={
          !templateName.trim() ||
          !currentTemplate.activity ||
          !currentTemplate.duration ||
          (currentTemplate.staff?.length || 0) === 0 ||
          (currentTemplate.clients?.length || 0) === 0
        }
      >
        <Save className="w-4 h-4 mr-2" />
        Save Template & Add to Pool
      </Button>
    </div>
  );
}

