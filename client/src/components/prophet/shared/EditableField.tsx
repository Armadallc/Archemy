/**
 * Editable Field Component
 * Click-to-edit inline input for rates, limits, and values
 */

import React, { useState, useRef, useEffect } from 'react';
// Force Vite to re-process this file
import { Input } from '../../ui/input';
import { cn } from '../../../lib/utils';
import { Check, X, Pencil } from 'lucide-react';

interface EditableFieldProps {
  value: number | string;
  onChange: (value: number | string) => void;
  type?: 'number' | 'text' | 'currency';
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  displayClassName?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function EditableField({
  value,
  onChange,
  type = 'number',
  prefix = '',
  suffix = '',
  min,
  max,
  step = 0.01,
  className,
  displayClassName,
  disabled = false,
  placeholder = '—',
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (type === 'number' || type === 'currency') {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue)) {
        let finalValue = numValue;
        if (min !== undefined) finalValue = Math.max(min, finalValue);
        if (max !== undefined) finalValue = Math.min(max, finalValue);
        onChange(finalValue);
      }
    } else {
      onChange(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplay = (val: number | string): string => {
    if (val === '' || val === null || val === undefined) return placeholder;
    
    if (type === 'currency') {
      return `$${Number(val).toFixed(2)}`;
    }
    if (type === 'number') {
      const num = Number(val);
      return Number.isInteger(num) ? String(num) : num.toFixed(2);
    }
    return String(val);
  };

  if (disabled) {
    return (
      <span className={cn('text-muted-foreground', displayClassName)}>
        {prefix}
        {formatDisplay(value)}
        {suffix}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
        <Input
          ref={inputRef}
          type={type === 'currency' ? 'number' : type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          min={min}
          max={max}
          step={step}
          className="h-7 w-24 text-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        />
        {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
        <button
          onClick={handleSave}
          className="p-1 hover:bg-status-success-bg rounded text-status-success"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-status-error-bg rounded text-status-error"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setEditValue(String(value));
        setIsEditing(true);
      }}
      className={cn(
        'group inline-flex items-center gap-1 px-1.5 py-0.5 rounded',
        'hover:bg-muted transition-colors cursor-pointer',
        'text-foreground font-medium',
        displayClassName
      )}
    >
      {prefix}
      {formatDisplay(value)}
      {suffix}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}