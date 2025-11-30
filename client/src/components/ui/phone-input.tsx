import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: string;
  className?: string;
}

/**
 * Standardized phone input component that:
 * - Only allows numeric input
 * - Auto-formats to (XXX) XXX-XXXX format
 * - Stores in E.164 format (+1XXXXXXXXXX) for database
 * - Displays in user-friendly format
 */
export function PhoneInput({
  value = '',
  onChange,
  defaultCountry = 'US',
  className,
  ...props
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Format phone number for display: (XXX) XXX-XXXX
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters
    const numbers = phone.replace(/\D/g, '');
    
    // Limit to 10 digits (US phone numbers)
    const limitedNumbers = numbers.slice(0, 10);
    
    // Format based on length
    if (limitedNumbers.length === 0) return '';
    if (limitedNumbers.length <= 3) return `(${limitedNumbers}`;
    if (limitedNumbers.length <= 6) return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3)}`;
    return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
  };

  // Convert formatted display value to E.164 format (+1XXXXXXXXXX)
  const toE164 = (formatted: string): string => {
    const numbers = formatted.replace(/\D/g, '');
    if (numbers.length === 10) {
      return `+1${numbers}`;
    }
    return numbers.length > 0 ? `+1${numbers}` : '';
  };

  // Convert E.164 format to display format
  const fromE164 = (e164: string): string => {
    if (!e164) return '';
    // Remove +1 prefix if present
    const numbers = e164.replace(/^\+1/, '').replace(/\D/g, '');
    return formatPhoneNumber(numbers);
  };

  // Initialize display value from prop
  useEffect(() => {
    if (value) {
      // If value is already in E.164 format, convert to display
      if (value.startsWith('+1')) {
        setDisplayValue(fromE164(value));
      } else {
        // Otherwise, format it
        setDisplayValue(formatPhoneNumber(value));
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Only allow digits, spaces, parentheses, and dashes
    const cleaned = input.replace(/[^\d\s\(\)\-]/g, '');
    
    // Format the phone number
    const formatted = formatPhoneNumber(cleaned);
    setDisplayValue(formatted);
    
    // Convert to E.164 format and call onChange
    const e164 = toE164(formatted);
    onChange?.(e164);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, arrow keys
    if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right arrow keys
        (e.keyCode >= 35 && e.keyCode <= 40)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const numbers = pasted.replace(/\D/g, '').slice(0, 10);
    const formatted = formatPhoneNumber(numbers);
    setDisplayValue(formatted);
    const e164 = toE164(formatted);
    onChange?.(e164);
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder="(555) 123-4567"
      className={cn(className)}
      maxLength={14} // (XXX) XXX-XXXX = 14 characters
    />
  );
}


