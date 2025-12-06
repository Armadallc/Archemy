/**
 * BentoBox Calendar - Encounter Actions Component
 * 
 * Provides edit, duplicate, and delete actions for scheduled encounters
 */

import React, { useState } from 'react';
import { useBentoBoxStore } from './store';
import { ScheduledEncounter } from './types';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface EncounterActionsProps {
  encounter: ScheduledEncounter;
  onEdit?: () => void;
}

export function EncounterActions({ encounter, onEdit }: EncounterActionsProps) {
  const { deleteScheduledEncounter, duplicateEncounter } = useBentoBoxStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);

  const handleDuplicate = () => {
    duplicateEncounter(encounter.id);
  };

  const handleDelete = () => {
    deleteScheduledEncounter(encounter.id, deleteAll);
    setShowDeleteDialog(false);
    setDeleteAll(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 pt-2 border-t min-w-0 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="flex-1 min-w-0 shrink justify-center"
        >
          <span className="truncate">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="flex-1 min-w-0 shrink justify-center"
        >
          <span className="truncate">Duplicate</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="flex-1 min-w-0 shrink justify-center text-destructive hover:text-destructive"
        >
          <span className="truncate">Remove</span>
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Encounter</AlertDialogTitle>
            <AlertDialogDescription>
              {encounter.isDuplicate || encounter.childIds?.length
                ? 'Do you want to remove only this instance, or all duplicates?'
                : 'Are you sure you want to remove this encounter from the calendar?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(encounter.isDuplicate || encounter.childIds?.length) && (
            <div className="space-y-2 py-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!deleteAll}
                  onChange={() => setDeleteAll(false)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Remove this instance only</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={deleteAll}
                  onChange={() => setDeleteAll(true)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Remove all duplicates</span>
              </label>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAll(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

