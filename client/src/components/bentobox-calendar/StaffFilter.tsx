/**
 * Staff Filter Component
 * 
 * Allows users to filter encounters by staff members
 * Only visible when feature flag is enabled
 */

import React from 'react';
import { useBentoBoxStore } from './store';
import { StaffAtom } from './types';
import { getAllStaffMembers, matchesStaffFilter } from './utils/staff-filter';
import { FEATURE_FLAGS } from '../../lib/feature-flags';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '../ui/dropdown-menu';
import { Checkbox } from '../ui/checkbox';
import { Users, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StaffFilter() {
  const { 
    library, 
    scheduledEncounters, 
    selectedStaffFilters,
    toggleStaffFilter,
    clearStaffFilters 
  } = useBentoBoxStore();

  // Only render if feature flag is enabled
  if (!FEATURE_FLAGS.FULL_CALENDAR_STAFF_FILTER) {
    return null;
  }

  // Get all unique staff members
  const allStaff = getAllStaffMembers(library.templates, scheduledEncounters);

  // If no staff members, don't show filter
  if (allStaff.length === 0) {
    return null;
  }

  const hasActiveFilters = selectedStaffFilters.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-2",
            hasActiveFilters && "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">
            {hasActiveFilters 
              ? `${selectedStaffFilters.length} staff` 
              : 'All Staff'}
          </span>
          <ChevronDown className="w-3 h-3" />
          {hasActiveFilters && (
            <X 
              className="w-3 h-3 ml-1" 
              onClick={(e) => {
                e.stopPropagation();
                clearStaffFilters();
              }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Filter by Staff</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearStaffFilters}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {allStaff.map((staff) => {
            const isSelected = selectedStaffFilters.includes(staff.id);
            return (
              <DropdownMenuCheckboxItem
                key={staff.id}
                checked={isSelected}
                onCheckedChange={() => toggleStaffFilter(staff.id)}
                className="flex items-start gap-2 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {staff.name}
                  </div>
                  {staff.role && (
                    <div className="text-xs text-muted-foreground truncate">
                      {staff.role}
                    </div>
                  )}
                </div>
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>
        {hasActiveFilters && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Showing encounters with {selectedStaffFilters.length} selected staff member{selectedStaffFilters.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

