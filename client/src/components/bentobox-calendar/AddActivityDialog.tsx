/**
 * BentoBox Calendar - Add Activity Dialog
 * 
 * Dialog for adding new encounter types (activities) to the library
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { TemplateCategory } from './types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface AddActivityDialogProps {
  trigger?: React.ReactNode;
}

export function AddActivityDialog({ trigger }: AddActivityDialogProps) {
  const { addAtom } = useBentoBoxStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('life-skills');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    // Generate ID for new activity
    const id = `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add the new activity atom
    addAtom(
      {
        id,
        name: name.trim(),
        category,
        type: 'activity',
      },
      'activity'
    );

    // Reset form and close dialog
    setName('');
    setCategory('life-skills');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Encounter Type</DialogTitle>
          <DialogDescription>
            Create a new activity type that can be used in encounter templates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activity-name">Activity Name *</Label>
              <Input
                id="activity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Life-Skills Group, Therapy, Fitness"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-category">Category *</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as TemplateCategory)}
              >
                <SelectTrigger id="activity-category">
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



