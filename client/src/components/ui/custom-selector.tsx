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
          "flex items-center gap-3 flex-1 w-full px-3 py-2 text-left text-sm border rounded-md focus:outline-none focus:ring-2 transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        style={{ 
          borderColor: 'var(--border)', 
          borderWidth: '1px', 
          borderStyle: 'solid',
          backgroundColor: 'var(--background)'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--muted)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--background)';
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
        <div className="absolute z-50 w-full mt-1 rounded-md shadow-lg" style={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className="w-full px-3 py-2 text-left text-sm transition-colors"
              style={selectedValue === option.value ? { backgroundColor: 'rgba(124, 173, 197, 0.1)', color: 'var(--blue-11)' } : {}}
              onMouseEnter={(e) => {
                if (selectedValue !== option.value) {
                  e.currentTarget.style.backgroundColor = 'var(--gray-2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedValue !== option.value) {
                  e.currentTarget.style.backgroundColor = '';
                }
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
