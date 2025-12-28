import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { DatePickerWithRange } from '../ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  Filter, 
  X, 
  Calendar, 
  Search, 
  SortAsc, 
  SortDesc,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'checkbox' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  multiple?: boolean;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  sortOptions: SortOption[];
  onFiltersChange: (filters: FilterState) => void;
  onSortChange: (sort: SortOption | null) => void;
  onSearchChange: (search: string) => void;
  searchPlaceholder?: string;
  className?: string;
  showSearch?: boolean;
  showSort?: boolean;
  showReset?: boolean;
}

export default function AdvancedFilters({
  filters,
  sortOptions,
  onFiltersChange,
  onSortChange,
  onSearchChange,
  searchPlaceholder = "Search...",
  className = "",
  showSearch = true,
  showSort = true,
  showReset = true
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({});
  const [sortState, setSortState] = useState<SortOption | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Initialize filters
  useEffect(() => {
    const initialFilters: FilterState = {};
    filters.forEach(filter => {
      if (filter.type === 'checkbox' || filter.multiple) {
        initialFilters[filter.key] = [];
      } else {
        initialFilters[filter.key] = '';
      }
    });
    setFilterState(initialFilters);
  }, [filters]);

  // Update active filters when filter state changes
  useEffect(() => {
    const active = Object.entries(filterState)
      .filter(([key, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== '' && value !== null && value !== undefined;
      })
      .map(([key]) => key);
    setActiveFilters(active);
  }, [filterState]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilterState = { ...filterState, [key]: value };
    setFilterState(newFilterState);
    onFiltersChange(newFilterState);
  };

  const handleSortChange = (sortKey: string) => {
    const sortOption = sortOptions.find(option => option.key === sortKey);
    if (sortOption) {
      setSortState(sortOption);
      onSortChange(sortOption);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {};
    filters.forEach(filter => {
      if (filter.type === 'checkbox' || filter.multiple) {
        resetFilters[filter.key] = [];
      } else {
        resetFilters[filter.key] = '';
      }
    });
    setFilterState(resetFilters);
    setSortState(null);
    setSearchTerm('');
    onFiltersChange(resetFilters);
    onSortChange(null);
    onSearchChange('');
  };

  const removeFilter = (key: string) => {
    const newFilterState = { ...filterState };
    const filter = filters.find(f => f.key === key);
    
    if (filter?.type === 'checkbox' || filter?.multiple) {
      newFilterState[key] = [];
    } else {
      newFilterState[key] = '';
    }
    
    setFilterState(newFilterState);
    onFiltersChange(newFilterState);
  };

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'text':
      case 'number':
        return (
          <Input
            type={filter.type}
            placeholder={filter.placeholder}
            value={filterState[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full card-neu-flat [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        );

      case 'select':
        return (
          <Select
            value={filterState[filter.key] || ''}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger 
              className="card-neu-flat hover:card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent 
              className="card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              {filter.options?.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="hover:card-neu-flat"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.key}-${option.value}`}
                  checked={filterState[filter.key]?.includes(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = filterState[filter.key] || [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    handleFilterChange(filter.key, newValues);
                  }}
                />
                <Label htmlFor={`${filter.key}-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={filterState[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full card-neu-flat [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        );

      case 'dateRange':
        return (
          <DatePickerWithRange
            value={filterState[filter.key]}
            onChange={(value) => handleFilterChange(filter.key, value)}
            placeholder="Select date range"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-2 flex-1">
        {showSearch && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 card-neu-flat [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            />
          </div>
        )}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 card-neu-flat hover:card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilters.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 card-neu [&]:shadow-none" 
            align="start"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          >
            <Card className="card-neu [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label htmlFor={filter.key} className="text-sm font-medium">
                      {filter.label}
                    </Label>
                    {renderFilterInput(filter)}
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="flex items-center space-x-2 card-neu-flat hover:card-neu [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="card-neu hover:card-neu [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {showSort && (
          <Select
            value={sortState?.key || ''}
            onValueChange={handleSortChange}
          >
            <SelectTrigger 
              className="w-40 card-neu-flat hover:card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent 
              className="card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              {sortOptions.map((option) => (
                <SelectItem 
                  key={option.key} 
                  value={option.key}
                  className="hover:card-neu-flat"
                >
                  <div className="flex items-center space-x-2">
                    {option.direction === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((key) => {
            const filter = filters.find(f => f.key === key);
            const value = filterState[key];
            
            if (!filter) return null;

            let displayValue = '';
            if (Array.isArray(value)) {
              displayValue = value.join(', ');
            } else if (filter.type === 'dateRange' && value?.from) {
              displayValue = `${format(value.from, 'MMM dd')} - ${format(value.to, 'MMM dd')}`;
            } else {
              displayValue = String(value);
            }

            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span className="font-medium">{filter.label}:</span>
                <span>{displayValue}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFilter(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}







