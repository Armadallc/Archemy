import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CustomSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}

export const CustomSelector: React.FC<CustomSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select option",
  options,
  className,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update internal state when value prop changes
  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(option => option.value === selectedValue);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onValueChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-3 flex-1 w-full px-3 py-2 text-left text-sm rounded-md focus:outline-none focus:ring-2 transition-colors card-neu-flat hover:card-neu [&]:shadow-none",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        style={{ 
          backgroundColor: 'var(--background)',
          border: 'none'
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--blue-9)';
          e.currentTarget.style.borderColor = 'var(--blue-9)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <span className="flex-1" style={!selectedOption ? { color: 'var(--muted-foreground)' } : { color: 'var(--foreground)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} style={{ color: 'var(--muted-foreground)' }} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-md card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className="w-full px-3 py-2 text-left text-sm transition-colors hover:card-neu-flat"
              style={{
                backgroundColor: selectedValue === option.value ? 'var(--muted)' : 'transparent',
                color: 'var(--foreground)'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
