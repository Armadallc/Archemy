/**
 * Client Group Merge/Replace Dialog
 * 
 * Dialog for choosing whether to merge or replace clients when dropping
 * a client group into an encounter template
 */

import React from 'react';
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
import { Button } from '../ui/button';
import { ClientGroupAtom } from './types';

interface ClientGroupMergeDialogProps {
  open: boolean;
  clientGroup: ClientGroupAtom | null;
  encounterTitle: string;
  existingClientCount: number;
  onMerge: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

export function ClientGroupMergeDialog({
  open,
  clientGroup,
  encounterTitle,
  existingClientCount,
  onMerge,
  onReplace,
  onCancel,
}: ClientGroupMergeDialogProps) {
  if (!clientGroup) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Client Group to Encounter</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 mt-2">
              <p>
                You're adding <strong>"{clientGroup.name}"</strong> ({clientGroup.clientIds.length} clients) 
                to <strong>"{encounterTitle}"</strong>.
              </p>
              {existingClientCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  This encounter currently has {existingClientCount} client{existingClientCount !== 1 ? 's' : ''}.
                </p>
              )}
              <p className="font-medium mt-4">Choose an action:</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onReplace}
            className="w-full sm:w-auto"
          >
            Replace All Clients
          </Button>
          <Button
            onClick={onMerge}
            className="w-full sm:w-auto"
          >
            Merge (Add to Existing)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

