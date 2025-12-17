import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  ArrowUpDown,
  X
} from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";
import { UserAvatar } from "../users/UserAvatar";
import { PhoneInput } from "../ui/phone-input";
import { Textarea } from "../ui/textarea";

interface Contact {
  id: string;
  owner_user_id: string;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
  role?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  category_custom_text?: string | null;
  program_id?: string | null;
  program_name?: string | null;
  location_id?: string | null;
  location_name?: string | null;
  is_active: boolean;
  is_app_user: boolean;
  avatar_url?: string | null;
  notes?: string | null;
  corporate_client_name?: string | null;
}

interface ContactCategory {
  id: string;
  name: string;
  allows_custom_text: boolean;
}

interface ContactFilters {
  category_id?: string;
  role?: string;
  program_id?: string;
  location_id?: string;
  search?: string;
  alphabetical?: 'asc' | 'desc';
}

export default function ContactsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<ContactFilters>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch contact categories
  const { data: categories = [] } = useQuery<ContactCategory[]>({
    queryKey: ['/api/contacts/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/contacts/categories');
      return await response.json();
    },
  });

  // Fetch contacts with filters
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.role) params.append('role', filters.role);
      if (filters.program_id) params.append('program_id', filters.program_id);
      if (filters.location_id) params.append('location_id', filters.location_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.alphabetical) params.append('alphabetical', filters.alphabetical);
      
      const response = await apiRequest('GET', `/api/contacts?${params.toString()}`);
      return await response.json();
    },
    enabled: !!user,
  });

  // Fetch programs for filter
  const { data: programs = [] } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/programs');
      return await response.json();
    },
  });

  // Fetch locations for filter
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/locations');
      return await response.json();
    },
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (contactData: Partial<Contact>) => {
      const response = await apiRequest('POST', '/api/contacts', contactData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact Created",
        description: "Contact has been added successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contact.",
        variant: "destructive",
      });
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contact> }) => {
      const response = await apiRequest('PATCH', `/api/contacts/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact Updated",
        description: "Contact has been updated successfully.",
      });
      setEditingContact(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact.",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact Deleted",
        description: "Contact has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact.",
        variant: "destructive",
      });
    },
  });

  // Sync tenant users mutation
  const syncTenantMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/contacts/sync-tenant');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.synced_count || 0} tenant users to contacts.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync tenant users.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value || undefined }));
  };

  const handleFilterChange = (key: keyof ContactFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleAlphabeticalSort = () => {
    setFilters(prev => ({
      ...prev,
      alphabetical: prev.alphabetical === 'asc' ? 'desc' : prev.alphabetical === 'desc' ? undefined : 'asc'
    }));
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(id);
    }
  };

  // Get unique roles from contacts
  const uniqueRoles = Array.from(new Set(contacts.map(c => c.role).filter(Boolean)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contacts Directory</CardTitle>
              <CardDescription>
                Your personal phone book. Add contacts or sync tenant users automatically.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncTenantMutation.mutate()}
                disabled={syncTenantMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncTenantMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Tenant Users
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select
                value={filters.category_id || "all"}
                onValueChange={(value) => handleFilterChange('category_id', value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select
                value={filters.role || "all"}
                onValueChange={(value) => handleFilterChange('role', value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.filter(role => role).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Program Filter */}
              <Select
                value={filters.program_id || "all"}
                onValueChange={(value) => handleFilterChange('program_id', value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program: any) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Alphabetical Sort */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAlphabeticalSort}
                className="w-[140px]"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {filters.alphabetical === 'asc' ? 'A-Z' : filters.alphabetical === 'desc' ? 'Z-A' : 'Sort'}
              </Button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No contacts found.</p>
              <p className="text-sm mt-2">Click "Add Contact" to create your first contact, or "Sync Tenant Users" to auto-populate.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Tenant/Corporate Client</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Active Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <UserAvatar
                          user={{
                            user_id: contact.user_id || contact.id,
                            user_name: `${contact.first_name} ${contact.last_name}`,
                            email: contact.email || undefined,
                            avatar_url: contact.avatar_url,
                            first_name: contact.first_name,
                            last_name: contact.last_name,
                          }}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{contact.first_name}</TableCell>
                      <TableCell>{contact.last_name}</TableCell>
                      <TableCell>{contact.corporate_client_name || '-'}</TableCell>
                      <TableCell>{contact.program_name || '-'}</TableCell>
                      <TableCell>{contact.role || '-'}</TableCell>
                      <TableCell>{contact.phone || '-'}</TableCell>
                      <TableCell>{contact.email || '-'}</TableCell>
                      <TableCell>
                        {contact.category_name ? (
                          <Badge variant="outline">
                            {contact.category_name}
                            {contact.category_custom_text && `: ${contact.category_custom_text}`}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={contact.is_active ? "default" : "secondary"}>
                          {contact.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Contact Dialog */}
      <ContactFormDialog
        isOpen={isAddDialogOpen || !!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingContact(null);
          }
        }}
        contact={editingContact}
        categories={categories}
        programs={programs}
        locations={locations}
        onSubmit={(data) => {
          if (editingContact) {
            updateContactMutation.mutate({ id: editingContact.id, updates: data });
          } else {
            createContactMutation.mutate(data);
          }
        }}
        isPending={createContactMutation.isPending || updateContactMutation.isPending}
      />
    </div>
  );
}

// Contact Form Dialog Component
interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  categories: ContactCategory[];
  programs: any[];
  locations: any[];
  onSubmit: (data: Partial<Contact>) => void;
  isPending: boolean;
}

function ContactFormDialog({
  isOpen,
  onOpenChange,
  contact,
  categories,
  programs,
  locations,
  onSubmit,
  isPending
}: ContactFormDialogProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    category_id: '',
    category_custom_text: '',
    program_id: '',
    location_id: '',
    notes: '',
    user_id: '',
    is_app_user: false,
  });

  // Reset form when dialog opens/closes or contact changes
  React.useEffect(() => {
    if (isOpen) {
      if (contact) {
        setFormData({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          organization: contact.organization || '',
          role: contact.role || '',
          category_id: contact.category_id || '',
          category_custom_text: contact.category_custom_text || '',
          program_id: contact.program_id || '',
          location_id: contact.location_id || '',
          notes: contact.notes || '',
          user_id: contact.user_id || '',
          is_app_user: contact.is_app_user || false,
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          organization: '',
          role: '',
          category_id: '',
          category_custom_text: '',
          program_id: '',
          location_id: '',
          notes: '',
          user_id: '',
          is_app_user: false,
        });
      }
    }
  }, [isOpen, contact]);

  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const showCustomText = selectedCategory?.allows_custom_text;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email || null,
      phone: formData.phone || null,
      organization: formData.organization || null,
      role: formData.role || null,
      category_id: formData.category_id || null,
      category_custom_text: showCustomText ? (formData.category_custom_text || null) : null,
      program_id: formData.program_id || null,
      location_id: formData.location_id || null,
      notes: formData.notes || null,
    };

    if (formData.is_app_user && formData.user_id) {
      submitData.user_id = formData.user_id;
    }

    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          <DialogDescription>
            {contact ? 'Update contact information' : 'Add a new contact to your personal directory'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="For external contacts"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Case Manager, Therapist, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                value={formData.category_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, category_id: value || '', category_custom_text: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCustomText && (
              <div className="space-y-2">
                <Label htmlFor="category_custom_text">Custom Category Description</Label>
                <Input
                  id="category_custom_text"
                  value={formData.category_custom_text}
                  onChange={(e) => setFormData({ ...formData, category_custom_text: e.target.value })}
                  placeholder="Enter custom category description"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program_id">Program (for filtering)</Label>
              <Select
                value={formData.program_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, program_id: value || '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program: any) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_id">Location (for filtering)</Label>
              <Select
                value={formData.location_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, location_id: value || '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc: any) => !formData.program_id || loc.program_id === formData.program_id)
                    .map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name || location.address}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Personal notes about this contact"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

