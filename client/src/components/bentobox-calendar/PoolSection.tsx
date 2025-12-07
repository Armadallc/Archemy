/**
 * BentoBox Calendar - Pool Section Component
 * 
 * Displays templates in the pool with X buttons for removal
 */

import React, { useState } from 'react';
import { GripVertical, X, Edit } from 'lucide-react';
import { useBentoBoxStore } from './store';
import { PoolTemplate } from './types';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface PoolSectionProps {
  onEdit?: (templateId: string) => void;
  className?: string;
}

export function PoolSection({ onEdit, className }: PoolSectionProps) {
  const { pool, removeFromPool, clearPool, library } = useBentoBoxStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleRemove = (poolTemplate: PoolTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromPool(poolTemplate.id);
  };

  const handleEdit = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(templateId);
    }
  };

  const handleClearAll = () => {
    if (pool.length === 0) return;
    if (confirm(`Clear all ${pool.length} item${pool.length !== 1 ? 's' : ''} from pool?`)) {
      clearPool();
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      coral: 'bg-[#ff8475]/20 text-[#ff8475] border-[#ff8475]/30',
      lime: 'bg-[#f1fec9]/40 text-[#26282b] border-[#f1fec9]/50',
      ice: 'bg-[#e8fffe]/40 text-[#26282b] border-[#e8fffe]/50',
      charcoal: 'bg-[#26282b]/20 text-[#26282b] border-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
      silver: 'bg-[#eaeaea]/40 text-[#26282b] border-[#eaeaea]/50',
    };
    return colorMap[color] || colorMap.silver;
  };

  const handleDragStart = (e: React.DragEvent, poolTemplate: PoolTemplate) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pool-template',
      templateId: poolTemplate.templateId,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };


  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Clear All Button */}
      {pool.length > 0 && (
        <div className="p-1 border-b flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-6 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={handleClearAll}
          >
            Clear All ({pool.length})
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1.5 p-1">
        {/* Encounter Templates */}
        <div className="mb-2">
          <h4 className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
            Templates
          </h4>
          <div className="space-y-1">
            {pool
              .filter((p) => {
                const template = library.templates.find((t) => t.id === p.templateId);
                return template; // Only show if template exists (not client groups)
              })
              .map((poolTemplate) => {
                const template = library.templates.find((t) => t.id === poolTemplate.templateId);
                if (!template) return null;

                return (
                  <div
                    key={poolTemplate.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(e, poolTemplate);
                    }}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group relative p-1.5 rounded border cursor-move transition-all flex items-center gap-1.5",
                      getColorClasses(poolTemplate.color),
                      "hover:shadow-sm"
                    )}
                  >
                    <GripVertical className="w-3 h-3 opacity-50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[11px] leading-tight truncate">{poolTemplate.name}</div>
                      <div className="text-[10px] opacity-70 leading-tight">
                        {poolTemplate.quickInfo.duration} • {poolTemplate.quickInfo.staffInitials}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {onEdit && (
                        <button
                          onClick={(e) => handleEdit(poolTemplate.templateId, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-background/50 rounded transition-opacity"
                          title="Edit template"
                        >
                          <Edit className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleRemove(poolTemplate, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/10 rounded transition-opacity"
                        title="Remove from pool"
                      >
                        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Client Groups */}
        <div>
          <h4 className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
            Client Groups
          </h4>
          <div className="space-y-1">
            {pool
              .filter((p) => {
                // Check if this is a client group (not a template)
                const template = library.templates.find((t) => t.id === p.templateId);
                const clientGroup = library.atoms.clientGroups.find((g) => g.id === p.templateId);
                return !template && clientGroup; // Show if it's a client group, not a template
              })
              .map((poolTemplate) => {
                const clientGroup = library.atoms.clientGroups.find((g) => g.id === poolTemplate.templateId);
                if (!clientGroup) return null;

                return (
                  <div
                    key={poolTemplate.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'client-group',
                        clientGroupId: clientGroup.id,
                      }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group relative p-1.5 rounded border cursor-move transition-all flex items-center gap-1.5",
                      getColorClasses(poolTemplate.color),
                      "hover:shadow-sm"
                    )}
                  >
                    <GripVertical className="w-3 h-3 opacity-50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[11px] leading-tight truncate">{poolTemplate.name}</div>
                      <div className="text-[10px] opacity-70 leading-tight">
                        {poolTemplate.quickInfo.clientCount} clients
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemove(poolTemplate, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/10 rounded transition-opacity flex-shrink-0"
                      title="Remove from pool"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

