import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

interface Organization {
  id: string;
  name: string;
  isActive: boolean;
}

interface OrganizationSelectorProps {
  selectedOrganizationId?: string;
  onOrganizationChange?: (organizationId: string) => void;
  disabled?: boolean;
}

export default function OrganizationSelector({ 
  selectedOrganizationId, 
  onOrganizationChange, 
  disabled = false 
}: OrganizationSelectorProps = {}) {
  const { currentOrganization, setCurrentOrganization, switchOrganization, refetchOrganization } = useOrganization();
  
  // Use context if props not provided
  const currentOrgId = selectedOrganizationId || currentOrganization?.id || "";
  const queryClient = useQueryClient();
  
  const handleChange = onOrganizationChange || ((orgId: string) => {
    console.log('🔄 Organization selector changing to:', orgId);
    
    // Immediately clear all cached organization data
    queryClient.removeQueries({ queryKey: ["/api/organizations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    
    if (switchOrganization) {
      switchOrganization(orgId);
    } else {
      // Fallback for when switchOrganization is not available
      const orgData = { id: orgId, name: orgId.replace('_', ' '), isActive: true };
      setCurrentOrganization(orgData);
    }
    
    // Force refetch after clearing cache
    setTimeout(() => {
      if (refetchOrganization) refetchOrganization();
      queryClient.refetchQueries({ queryKey: ["/api/organizations", orgId] });
    }, 200);
  });
  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: !disabled
  });

  const availableOrganizations = organizations?.filter(org => org.isActive) || [];
  const selectedOrg = availableOrganizations.find(org => org.id === currentOrgId);

  return (
    <div className="space-y-2">
      <Label htmlFor="organization-select" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Organization
      </Label>
      <Select
        value={currentOrgId}
        onValueChange={handleChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="organization-select">
          <SelectValue 
            placeholder={isLoading ? "Loading organizations..." : "Select organization"}
          />
        </SelectTrigger>
        <SelectContent>
          {availableOrganizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedOrg && (
        <p className="text-sm text-muted-foreground">
          Booking for: {selectedOrg.name}
        </p>
      )}
    </div>
  );
}