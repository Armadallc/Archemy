/**
 * Trip Purpose & Billing Code Selector Component
 * 
 * Provides UI for selecting:
 * - Trip Purpose (Legal, Groceries, Community, Program (adjacent), Medical, Non-Medical)
 * - Trip Code (CPT/HCPCS billing codes from Prophet calculator)
 * - Modifier (2 uppercase letters, only shown if trip_code selected)
 * - Appointment Time
 */

import React from "react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { useQuery } from "@tanstack/react-query";

// Trip Purpose Options
export const TRIP_PURPOSE_OPTIONS = [
  { value: "Legal", label: "Legal" },
  { value: "Groceries", label: "Groceries" },
  { value: "Community", label: "Community" },
  { value: "Program (adjacent)", label: "Program (adjacent)" },
  { value: "Medical", label: "Medical" },
  { value: "Non-Medical", label: "Non-Medical" },
] as const;

export type TripPurpose = typeof TRIP_PURPOSE_OPTIONS[number]["value"];

interface ServiceCode {
  id: string;
  code: string;
  modifier?: string;
  category: string;
  description: string;
  rateType: string;
  baseRate: number;
  mileageRate?: number;
  isBlocked?: boolean;
  blockReason?: string;
}

interface TripPurposeBillingSelectorProps {
  tripPurpose?: string | null;
  tripCode?: string | null;
  tripModifier?: string | null;
  onTripPurposeChange: (value: string) => void;
  onTripCodeChange: (value: string) => void;
  onTripModifierChange: (value: string) => void;
  className?: string;
}

export function TripPurposeBillingSelector({
  tripPurpose,
  tripCode,
  tripModifier,
  onTripPurposeChange,
  onTripCodeChange,
  onTripModifierChange,
  className = "",
}: TripPurposeBillingSelectorProps) {
  // Debug: Log that component is rendering
  React.useEffect(() => {
    console.log("✅ TripPurposeBillingSelector component mounted");
  }, []);

  // Fetch service codes from Prophet calculator
  // Use static import to avoid dynamic import issues
  const { data: serviceCodes = [] } = useQuery<ServiceCode[]>({
    queryKey: ["service-codes"],
    queryFn: async () => {
      try {
        // Use dynamic import with proper error handling
        const module = await import("../prophet/data/coloradoMedicaidCodes");
        const { bhstCodes, nemtCodes, nmtCodes } = module;
        
        // Combine all codes
        const allCodes = [
          ...(bhstCodes || []),
          ...(nemtCodes || []),
          ...(nmtCodes || []),
        ];
        
        // Return unique codes (by code + modifier combination)
        const uniqueCodes = new Map<string, ServiceCode>();
        allCodes.forEach((code) => {
          if (code && !code.isBlocked) {
            const key = `${code.code}${code.modifier || ""}`;
            if (!uniqueCodes.has(key)) {
              uniqueCodes.set(key, code);
            }
          }
        });
        return Array.from(uniqueCodes.values());
      } catch (error) {
        console.error("Error loading service codes:", error);
        // Return empty array on error so component still renders
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1, // Only retry once
  });

  // Get available modifiers for selected trip code
  const availableModifiers = React.useMemo(() => {
    if (!tripCode || !serviceCodes.length) return [];
    
    const codeData = serviceCodes.find(
      (sc) => sc.code === tripCode
    );
    
    if (!codeData) return [];
    
    // Get all modifiers for this code
    const modifiers = serviceCodes
      .filter((sc) => sc.code === tripCode && sc.modifier)
      .map((sc) => sc.modifier!)
      .filter((mod, index, self) => self.indexOf(mod) === index); // Unique
    
    return modifiers;
  }, [tripCode, serviceCodes]);

  // Format service code for display
  const formatServiceCode = (code: ServiceCode) => {
    const codeStr = code.modifier ? `${code.code}-${code.modifier}` : code.code;
    return `${codeStr} - ${code.description}`;
  };

  // Ensure component always renders, even if service codes fail to load
  if (!serviceCodes && serviceCodes !== undefined) {
    console.warn("Service codes not loaded yet");
  }

  // Always render - even if service codes fail to load
  return (
    <div className={`space-y-4 ${className}`} data-testid="trip-purpose-billing-selector">
      {/* Trip Purpose */}
      <div className="space-y-2">
        <Label htmlFor="trip-purpose" className="font-medium" style={{ fontSize: '16px' }}>PURPOSE</Label>
        <Select
          value={tripPurpose || "__none__"}
          onValueChange={(value) => {
            // Handle the "none" option
            if (value === "__none__") {
              onTripPurposeChange("");
            } else {
              onTripPurposeChange(value);
            }
          }}
        >
          <SelectTrigger id="trip-purpose">
            <SelectValue placeholder="Select trip purpose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select trip purpose</SelectItem>
            {TRIP_PURPOSE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Billing Code Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="font-medium" style={{ color: 'var(--foreground)', fontSize: '16px' }}>
          BILLING
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trip Code (Billing Code) */}
          <div className="space-y-2">
            <Label htmlFor="trip-code" className="font-normal" style={{ fontSize: '16px' }}>SVC CODE</Label>
            <Select
              value={tripCode || "__none__"}
              onValueChange={(value) => {
                // Handle the "none" option
                if (value === "__none__") {
                  onTripCodeChange("");
                  onTripModifierChange("");
                } else {
                  onTripCodeChange(value);
                  // Clear modifier if code is cleared
                  if (!value) {
                    onTripModifierChange("");
                  }
                }
              }}
            >
              <SelectTrigger id="trip-code">
                <SelectValue placeholder="Select billing code (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (No billing code)</SelectItem>
                {serviceCodes.map((code, index) => (
                  <SelectItem key={`${code.code}-${code.modifier || ''}-${index}`} value={code.code}>
                    {formatServiceCode(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modifier (only shown if trip_code is selected) */}
          {tripCode && (
            <div className="space-y-2">
              <Label htmlFor="trip-modifier">Modifier</Label>
              <Select
                value={tripModifier || "__none__"}
                onValueChange={(value) => {
                  // Handle the "none" option
                  if (value === "__none__") {
                    onTripModifierChange("");
                  } else {
                    onTripModifierChange(value);
                  }
                }}
              >
                <SelectTrigger id="trip-modifier">
                  <SelectValue placeholder="Select modifier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {availableModifiers.map((modifier) => (
                    <SelectItem key={modifier} value={modifier}>
                      {modifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableModifiers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No modifiers available for this code
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




