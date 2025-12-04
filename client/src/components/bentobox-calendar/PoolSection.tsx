/**
 * BentoBox Calendar - Pool Section Component
 * 
 * Displays templates in the pool with hover cards for Edit/Delete actions
 */

import React, { useState } from 'react';
import { Droplets, Edit, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { PoolTemplate } from './types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { cn } from '../../lib/utils';
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

interface PoolSectionProps {
  className?: string;
  onEdit?: (templateId: string) => void;
}

export function PoolSection({ className, onEdit }: PoolSectionProps) {
  const {
    pool,
    removeFromPool,
    deleteTemplate,
    getTemplateById,
  } = useBentoBoxStore();

  const [expanded, setExpanded] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PoolTemplate | null>(null);

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

  const handleDelete = () => {
    if (!templateToDelete) return;
    
    // Remove from pool
    removeFromPool(templateToDelete.id);
    
    // Optionally delete the template itself (user might want to keep it in library)
    // deleteTemplate(templateToDelete.templateId);
    
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleEdit = (templateId: string) => {
    if (onEdit) {
      onEdit(templateId);
    }
  };

  return (
    <>
      <div className={cn("border-b flex-shrink-0", className)}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            <span className="font-medium">Pool</span>
            {pool.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {pool.length}
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {expanded && (
          <div className="px-4 pb-4 space-y-2 flex-1 overflow-y-auto min-h-0">
            {pool.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                <Droplets className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No templates in pool</p>
                <p className="text-xs mt-1">Build templates to add them here</p>
              </div>
            ) : (
              pool.map((poolTemplate) => {
                const template = getTemplateById(poolTemplate.templateId);
                return (
                  <HoverCard key={poolTemplate.id} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Card
                        className={cn(
                          "cursor-move hover:shadow-md transition-shadow",
                          getColorClasses(poolTemplate.color)
                        )}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'pool-template',
                            poolId: poolTemplate.id,
                            templateId: poolTemplate.templateId,
                          }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-medium">{poolTemplate.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-xs space-y-1 text-muted-foreground">
                            <div>Staff: {poolTemplate.quickInfo.staffInitials}</div>
                            <div>Activity: {poolTemplate.quickInfo.activityCode}</div>
                            <div>Clients: {poolTemplate.quickInfo.clientCount}</div>
                            <div>Duration: {poolTemplate.quickInfo.duration}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">{poolTemplate.name}</h4>
                          {template?.description && (
                            <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                          )}
                          <div className="text-xs space-y-1">
                            <div><strong>Staff:</strong> {template?.staff.map(s => s.name).join(', ') || 'N/A'}</div>
                            <div><strong>Activity:</strong> {template?.activity.name || 'N/A'}</div>
                            <div><strong>Clients:</strong> {template?.clients.map(c => c.name).join(', ') || 'N/A'}</div>
                            {template?.location && (
                              <div><strong>Location:</strong> {template.location.name}</div>
                            )}
                            <div><strong>Duration:</strong> {template?.duration.label || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(poolTemplate.templateId)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTemplateToDelete(poolTemplate);
                              setDeleteDialogOpen(true);
                            }}
                            className="flex-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })
            )}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Pool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this template from the pool? The template will remain in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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

