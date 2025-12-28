import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

// US State codes for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface AddressInputProps {
  value?: AddressData | string; // Accept either separated fields or legacy full address string
  onChange?: (address: AddressData) => void;
  onFullAddressChange?: (fullAddress: string) => void; // For backward compatibility
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  error?: string;
  // Field-level props
  streetPlaceholder?: string;
  cityPlaceholder?: string;
  statePlaceholder?: string;
  zipPlaceholder?: string;
}

/**
 * Reusable Address Input Component with separated fields
 * Supports both new separated field format and legacy full address string
 */
export function AddressInput({
  value,
  onChange,
  onFullAddressChange,
  label = "Address",
  required = false,
  disabled = false,
  className,
  showLabel = true,
  error,
  streetPlaceholder = "123 Main St",
  cityPlaceholder = "City",
  statePlaceholder = "CO",
  zipPlaceholder = "80221"
}: AddressInputProps) {
  // Parse initial value - handle both formats
  const parseValue = (val: AddressData | string | undefined): AddressData => {
    if (!val) return { street: '', city: '', state: '', zip: '' };
    
    if (typeof val === 'string') {
      // Legacy format: parse full address string
      // Try to parse "Street, City, State ZIP" format
      const parts = val.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const street = parts[0];
        const city = parts[1];
        const stateZip = parts[2].split(/\s+/);
        const state = stateZip[0] || '';
        const zip = stateZip[1] || '';
        return { street, city, state: state.toUpperCase(), zip };
      }
      // If can't parse, put entire string in street
      return { street: val, city: '', state: '', zip: '' };
    }
    
    return val;
  };

  const [address, setAddress] = useState<AddressData>(parseValue(value));

  // Update local state when value prop changes
  useEffect(() => {
    setAddress(parseValue(value));
  }, [value]);

  // Generate full address string for backward compatibility
  const generateFullAddress = (addr: AddressData): string => {
    const parts = [
      addr.street,
      addr.city,
      addr.state && addr.zip ? `${addr.state} ${addr.zip}` : addr.state || addr.zip
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleFieldChange = (field: keyof AddressData, newValue: string) => {
    let processedValue = newValue;

    // Auto-format based on field type
    if (field === 'state') {
      // Convert to uppercase, limit to 2 characters
      processedValue = newValue.toUpperCase().slice(0, 2);
    } else if (field === 'zip') {
      // Only allow digits, limit to 5 characters
      processedValue = newValue.replace(/\D/g, '').slice(0, 5);
    }

    const updatedAddress = { ...address, [field]: processedValue };
    setAddress(updatedAddress);

    // Call onChange with separated fields
    if (onChange) {
      onChange(updatedAddress);
    }

    // Call onFullAddressChange for backward compatibility
    if (onFullAddressChange) {
      onFullAddressChange(generateFullAddress(updatedAddress));
    }
  };

  // Validation
  const validateState = (state: string): boolean => {
    if (!state) return !required;
    return state.length === 2 && US_STATES.includes(state.toUpperCase());
  };

  const validateZip = (zip: string): boolean => {
    if (!zip) return !required;
    return /^\d{5}$/.test(zip);
  };

  const stateError = address.state && !validateState(address.state) ? 'Invalid state code' : '';
  const zipError = address.zip && !validateZip(address.zip) ? 'ZIP must be 5 digits' : '';

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500 font-medium" : "font-medium"} style={{ fontSize: '16px' }}>
          {label}
        </Label>
      )}
      
      {/* Street Address */}
      <div>
        <Label htmlFor="street" className="text-sm text-muted-foreground">
          Street Address {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="street"
          value={address.street}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          placeholder={streetPlaceholder}
          required={required}
          disabled={disabled}
          className="mt-1 card-neu-pressed"
          style={{ backgroundColor: 'var(--background)', border: 'none' }}
        />
      </div>

      {/* City, State, ZIP Row */}
      <div className="grid grid-cols-12 gap-2">
        {/* City */}
        <div className="col-span-6">
          <Label htmlFor="city" className="text-sm text-muted-foreground">
            City {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder={cityPlaceholder}
            required={required}
            disabled={disabled}
            className="mt-1 card-neu-pressed"
          style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        </div>

        {/* State */}
        <div className="col-span-3">
          <Label htmlFor="state" className="text-sm text-muted-foreground">
            State {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="state"
            value={address.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            placeholder={statePlaceholder}
            required={required}
            disabled={disabled}
            className="mt-1 uppercase card-neu-pressed"
            maxLength={2}
            style={{ textTransform: 'uppercase', backgroundColor: 'var(--background)', border: 'none' }}
          />
          {stateError && (
            <p className="text-xs text-red-500 mt-1">{stateError}</p>
          )}
        </div>

        {/* ZIP */}
        <div className="col-span-3">
          <Label htmlFor="zip" className="text-sm text-muted-foreground">
            ZIP
          </Label>
          <Input
            id="zip"
            value={address.zip}
            onChange={(e) => handleFieldChange('zip', e.target.value)}
            placeholder={zipPlaceholder}
            disabled={disabled}
            className="mt-1 card-neu-pressed"
          style={{ backgroundColor: 'var(--background)', border: 'none' }}
            maxLength={5}
            pattern="[0-9]{5}"
          />
          {zipError && (
            <p className="text-xs text-red-500 mt-1">{zipError}</p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Display full address for reference (optional, can be hidden) */}
      {process.env.NODE_ENV === 'development' && address.street && (
        <p className="text-xs text-muted-foreground">
          Full: {generateFullAddress(address)}
        </p>
      )}
    </div>
  );
}

export default AddressInput;


