import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Flag, Plus } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useHierarchy } from "../../hooks/useHierarchy";
import { useAuth } from "../../hooks/useAuth";

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  program_id?: string | null;
  corporate_client_id?: string | null;
}

export default function FeatureFlagsTab() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newFeatureFlag, setNewFeatureFlag] = useState({
    flagName: '',
    isEnabled: false,
    program_id: '',
    corporate_client_id: ''
  });

  // Fetch programs for feature flag assignment (for super admins)
  const { data: programs } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/programs");
      return await response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Fetch corporate clients for feature flag assignment (for super admins)
  const { data: corporateClientsData } = useQuery({
    queryKey: ["/api/corporate-clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate-clients");
      const data = await response.json();
      return Array.isArray(data) ? data : (data.corporateClients || []);
    },
    enabled: user?.role === 'super_admin',
  });

  const corporateClients = corporateClientsData || [];

  // Fetch feature flags
  const { data: featureFlags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ['/api/feature-flags', level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = '/api/feature-flags';
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/feature-flags/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/feature-flags/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  const createFeatureFlagMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", '/api/feature-flags/create', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
      setNewFeatureFlag({ flagName: '', isEnabled: false, program_id: '', corporate_client_id: '' });
      toast({
        title: "Feature Flag Created",
        description: "The feature flag has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Feature Flag",
        description: error.message || "An error occurred while creating the feature flag.",
        variant: "destructive",
      });
    },
  });

  const toggleFeatureFlagMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", '/api/feature-flags/toggle', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
      toast({
        title: "Feature Flag Updated",
        description: "The feature flag has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Feature Flag",
        description: error.message || "An error occurred while updating the feature flag.",
        variant: "destructive",
      });
    },
  });

  const handleToggleFeatureFlag = (flag: FeatureFlag) => {
    toggleFeatureFlagMutation.mutate({
      id: flag.id,  // API expects 'id', not 'flag_id'
      is_enabled: !flag.is_enabled
    });
  };

  const handleCreateFeatureFlag = () => {
    if (newFeatureFlag.flagName) {
      createFeatureFlagMutation.mutate({
        flag_name: newFeatureFlag.flagName,
        is_enabled: newFeatureFlag.isEnabled,
        program_id: newFeatureFlag.program_id || selectedProgram || null,
        corporate_client_id: newFeatureFlag.corporate_client_id || selectedCorporateClient || null
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Flag className="w-5 h-5 mr-2" />
          Feature Flags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create New Feature Flag */}
        {user?.role === 'super_admin' && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">Create New Feature Flag</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="flagName">Flag Name</Label>
                <Input
                  id="flagName"
                  value={newFeatureFlag.flagName}
                  onChange={(e) => setNewFeatureFlag({...newFeatureFlag, flagName: e.target.value})}
                  placeholder="feature_name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flagProgram">Program (Optional)</Label>
                  <Select 
                    value={newFeatureFlag.program_id} 
                    onValueChange={(value) => setNewFeatureFlag({...newFeatureFlag, program_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs?.map((program: any) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="flagClient">Corporate Client (Optional)</Label>
                  <Select 
                    value={newFeatureFlag.corporate_client_id} 
                    onValueChange={(value) => setNewFeatureFlag({...newFeatureFlag, corporate_client_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {corporateClients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newFeatureFlag.isEnabled}
                  onCheckedChange={(checked) => setNewFeatureFlag({...newFeatureFlag, isEnabled: checked})}
                  aria-label="Enabled by default"
                />
                <Label htmlFor="flagEnabled">Enabled by default</Label>
              </div>

              <Button 
                onClick={handleCreateFeatureFlag}
                disabled={!newFeatureFlag.flagName || createFeatureFlagMutation.isPending}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Feature Flag
              </Button>
            </div>
          </div>
        )}

        {/* Current Feature Flags */}
        <div>
          <h3 className="font-medium mb-3">Current Feature Flags</h3>
          {flagsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-pulse">Loading feature flags...</div>
            </div>
          ) : featureFlags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No feature flags configured</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {featureFlags.map((flag: FeatureFlag) => (
                <div key={flag.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Flag className="w-4 h-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium">{flag.flag_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {flag.program_id ? `Program: ${flag.program_id}` : flag.corporate_client_id ? `Corporate Client: ${flag.corporate_client_id}` : 'Global'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                      {flag.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {user?.role === 'super_admin' && (
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => handleToggleFeatureFlag(flag)}
                        disabled={toggleFeatureFlagMutation.isPending}
                        aria-label={`Toggle ${flag.flag_name}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





