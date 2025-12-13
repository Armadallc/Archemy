import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { PhoneInput } from "../ui/phone-input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Loader2,
  Info
} from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";

interface CorporateClient {
  id: string;
  name: string;
}

interface Program {
  id: string;
  name: string;
  corporate_client_id: string;
}

export default function ProgramCreationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'program' | 'location'>('program');

  // Fetch corporate clients for program creation
  const { data: corporateClients = [] } = useQuery<CorporateClient[]>({
    queryKey: ['/api/corporate-clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate-clients');
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.corporateClients || []);
    },
    enabled: user?.role === 'super_admin' || user?.role === 'corporate_admin',
  });

  // Fetch programs for location creation
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/programs');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: true,
  });

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async ({ programData, logoFile }: { programData: any; logoFile?: File | null }) => {
      const response = await apiRequest('POST', '/api/corporate/programs', programData);
      const createdProgram = await response.json();
      
      // Upload logo if provided
      if (logoFile && createdProgram.id) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
        await fetch(`${apiBaseUrl}/api/programs/${createdProgram.id}/logo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData,
          credentials: 'include',
        });
      }
      
      return createdProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients/census'] });
      toast({
        title: "Success",
        description: "Program created successfully",
        variant: "success"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive"
      });
    },
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      const response = await apiRequest('POST', '/api/locations', locationData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients/census'] });
      toast({
        title: "Success",
        description: "Location created successfully",
        variant: "success"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create location",
        variant: "destructive"
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Programs & Locations</CardTitle>
          <CardDescription>
            Add new programs to corporate clients or create new locations for existing programs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'program' | 'location')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="program">Create Program</TabsTrigger>
              <TabsTrigger value="location">Create Location</TabsTrigger>
            </TabsList>
            
            <TabsContent value="program" className="mt-6">
              <CreateProgramForm
                corporateClients={corporateClients}
                onCreate={(data, logoFile) => createProgramMutation.mutate({ programData: data, logoFile })}
                isPending={createProgramMutation.isPending}
              />
            </TabsContent>
            
            <TabsContent value="location" className="mt-6">
              <CreateLocationForm
                programs={programs}
                onCreate={(data) => createLocationMutation.mutate(data)}
                isPending={createLocationMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Create Program Form Component
function CreateProgramForm({
  corporateClients,
  onCreate,
  isPending
}: {
  corporateClients: CorporateClient[];
  onCreate: (data: any, logoFile?: File | null) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    corporate_client_id: '',
    address: '',
    phone: '',
    email: '',
    is_active: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.corporate_client_id) {
      return;
    }
    onCreate(formData, logoFile);
    // Reset form
    setFormData({
      name: '',
      short_name: '',
      description: '',
      corporate_client_id: '',
      address: '',
      phone: '',
      email: '',
      is_active: true,
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-sm">Program Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prog-name">Program Name *</Label>
            <Input
              id="prog-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter program name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prog-short-name">Short Name</Label>
            <Input
              id="prog-short-name"
              value={formData.short_name}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              placeholder="Enter short name"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prog-description">Description</Label>
          <Textarea
            id="prog-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter program description"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prog-corporate-client">Corporate Client *</Label>
          <Select
            value={formData.corporate_client_id}
            onValueChange={(value) => setFormData({ ...formData, corporate_client_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select corporate client" />
            </SelectTrigger>
            <SelectContent>
              {corporateClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium text-sm">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prog-email">Email</Label>
            <Input
              id="prog-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="program@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prog-phone">Phone</Label>
            <PhoneInput
              id="prog-phone"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prog-address">Address</Label>
          <Textarea
            id="prog-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter program address"
            rows={2}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium text-sm">Logo</h3>
        <div className="space-y-2">
          <Label htmlFor="prog-logo">Upload Logo</Label>
          <Input
            id="prog-logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
          />
          {logoPreview && (
            <div className="mt-2">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-24 h-24 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="prog-active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="prog-active">Active</Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !formData.corporate_client_id}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Create Location Form Component
function CreateLocationForm({
  programs,
  onCreate,
  isPending
}: {
  programs: Program[];
  onCreate: (data: any) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    program_id: '',
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.program_id) {
      return;
    }
    onCreate(formData);
    // Reset form
    setFormData({
      name: '',
      address: '',
      program_id: '',
      is_active: true,
    });
  };

  // Group programs by corporate client for better UX
  const programsByClient = programs.reduce((acc, program) => {
    if (!acc[program.corporate_client_id]) {
      acc[program.corporate_client_id] = [];
    }
    acc[program.corporate_client_id].push(program);
    return acc;
  }, {} as Record<string, Program[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Locations will automatically inherit their program's logo. No logo upload is needed for locations.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="font-medium text-sm">Location Information</h3>
        <div className="space-y-2">
          <Label htmlFor="loc-program">Program *</Label>
          <Select
            value={formData.program_id}
            onValueChange={(value) => setFormData({ ...formData, program_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(programsByClient).map(([clientId, clientPrograms]) => (
                <div key={clientId}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {clientPrograms[0]?.corporate_client_id || 'Unknown Client'}
                  </div>
                  {clientPrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-name">Location Name</Label>
          <Input
            id="loc-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter location name (optional)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-address">Address *</Label>
          <Textarea
            id="loc-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter location address"
            rows={3}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="loc-active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="loc-active">Active</Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !formData.program_id}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Location
            </>
          )}
        </Button>
      </div>
    </form>
  );
}








