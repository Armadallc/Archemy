import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock, Users, MapPin, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";

interface Trip {
  id: string;
  recurring_trip_id?: string;
  client_id?: string;
  client_group_id?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  passenger_count: number;
  special_requirements?: string;
  notes?: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
  group_name?: string;
  deleteMode?: boolean;
}

interface RecurringTripModifyDialogProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecurringTripModifyDialog({ 
  trip, 
  isOpen, 
  onClose 
}: RecurringTripModifyDialogProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [action, setAction] = useState<'modify' | 'delete'>(trip.deleteMode ? 'delete' : 'modify');
  const [scope, setScope] = useState<'single' | 'all_future'>('single');
  const [formData, setFormData] = useState({
    client_id: trip.client_id || '',
    client_group_id: trip.client_group_id || '',
    pickup_address: trip.pickup_address || '',
    dropoff_address: trip.dropoff_address || '',
    scheduled_pickup_time: trip.scheduled_pickup_time?.split('T')[0] || '',
    pickup_time: trip.scheduled_pickup_time?.split('T')[1]?.substring(0, 5) || '',
    scheduled_return_time: trip.scheduled_return_time?.split('T')[1]?.substring(0, 5) || '',
    passenger_count: trip.passenger_count || 1,
    special_requirements: trip.special_requirements || '',
    notes: trip.notes || ''
  });

  // Get the current selection value for the Select component
  const getCurrentSelectValue = () => {
    if (formData.client_id) return formData.client_id;
    if (formData.client_group_id) return `group_${formData.client_group_id}`;
    return 'no_selection';
  };

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id && isOpen,
  });

  // Fetch client groups for selection
  const { data: clientGroups = [] } = useQuery({
    queryKey: ["/api/client-groups", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/client-groups/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id && isOpen,
  });

  // Modify recurring trip mutation
  const modifyMutation = useMutation({
    mutationFn: async ({ updates, modifyScope }: { updates: any; modifyScope: string }) => {
      const response = await apiRequest("PATCH", `/api/recurring-trips/${trip.recurring_trip_id}/modify`, {
        tripInstanceId: trip.id,
        modifyScope,
        updates
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-trips"] });
      
      toast({
        title: "Trip Modified",
        description: data.scope === 'single' 
          ? "Single trip instance updated successfully"
          : `${data.count} future trip instances updated successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to modify trip",
        variant: "destructive",
      });
    }
  });

  // Delete recurring trip mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ deleteScope }: { deleteScope: string }) => {
      if (trip.recurring_trip_id) {
        const response = await fetch(`/api/recurring-trips/${trip.recurring_trip_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scope: deleteScope })
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete recurring trip');
        }
        
        return response.json();
      } else {
        const response = await fetch(`/api/trips/${trip.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete trip');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-trips"] });
      
      toast({
        title: "Trip Deleted",
        description: scope === 'single' 
          ? "Trip cancelled successfully"
          : "Recurring trip deleted successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (action === 'modify') {
      const updates: any = {
        pickup_address: formData.pickup_address,
        dropoff_address: formData.dropoff_address,
        scheduled_pickup_time: `${formData.scheduled_pickup_time}T${formData.pickup_time}:00`,
        passenger_count: parseInt(formData.passenger_count.toString()),
        special_requirements: formData.special_requirements || null,
        notes: formData.notes || null
      };

      if (formData.scheduled_return_time) {
        updates.scheduled_return_time = `${formData.scheduled_pickup_time}T${formData.scheduled_return_time}:00`;
      }

      // Handle client vs group selection
      if (formData.client_id && formData.client_id !== 'group') {
        updates.client_id = formData.client_id;
        updates.client_group_id = null;
      } else if (formData.client_group_id) {
        updates.client_group_id = formData.client_group_id;
        updates.client_id = null;
      }

      modifyMutation.mutate({ updates, modifyScope: scope });
    } else {
      deleteMutation.mutate({ deleteScope: scope });
    }
  };

  const isRecurring = !!trip.recurring_trip_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isRecurring ? 'Modify Recurring Trip' : 'Modify Trip'}
          </DialogTitle>
          <DialogDescription>
            {action === 'delete' 
              ? 'Choose whether to delete this single trip or the entire recurring series.'
              : 'Modify trip details and choose whether changes apply to this trip only or all future instances.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trip Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {isRecurring ? 'Recurring Trip' : 'Single Trip'}
              </Badge>
              <span className="text-sm text-gray-600">
                {trip.clients ? `${trip.clients.first_name} ${trip.clients.last_name}` : trip.group_name}
              </span>
            </div>
            <p className="text-sm">
              {trip.pickup_address} → {trip.dropoff_address}
            </p>
          </div>

          {/* Action Selection */}
          <div>
            <Label>Action</Label>
            <RadioGroup value={action} onValueChange={(value: 'modify' | 'delete') => setAction(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="modify" id="modify" />
                <Label htmlFor="modify">Modify Trip</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete" className="text-red-600">Delete Trip</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Scope Selection (for recurring trips) */}
          {isRecurring && (
            <div>
              <Label>Modification Scope</Label>
              <RadioGroup value={scope} onValueChange={(value: 'single' | 'all_future') => setScope(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">This instance only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_future" id="all_future" />
                  <Label htmlFor="all_future">This and all future instances</Label>
                </div>
              </RadioGroup>
              
              {scope === 'all_future' && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      This will affect all future instances of this recurring trip
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modification Form */}
          {action === 'modify' && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                <TabsTrigger value="client">Client/Group</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickup_address">Pickup Address</Label>
                    <Input
                      id="pickup_address"
                      value={formData.pickup_address}
                      onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dropoff_address">Dropoff Address</Label>
                    <Input
                      id="dropoff_address"
                      value={formData.dropoff_address}
                      onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="scheduled_pickup_time">Date</Label>
                    <Input
                      id="scheduled_pickup_time"
                      type="date"
                      value={formData.scheduled_pickup_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_pickup_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup_time">Pickup Time</Label>
                    <Input
                      id="pickup_time"
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduled_return_time">Return Time (Optional)</Label>
                    <Input
                      id="scheduled_return_time"
                      type="time"
                      value={formData.scheduled_return_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_return_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passenger_count">Passenger Count</Label>
                    <Input
                      id="passenger_count"
                      type="number"
                      min="1"
                      value={formData.passenger_count}
                      onChange={(e) => setFormData({ ...formData, passenger_count: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="special_requirements">Special Requirements</Label>
                  <Textarea
                    id="special_requirements"
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="client" className="space-y-4">
                <div>
                  <Label>Assignment Type</Label>
                  <Select
                    value={getCurrentSelectValue()}
                    onValueChange={(value) => {
                      if (value === 'no_selection') {
                        setFormData({ ...formData, client_id: '', client_group_id: '' });
                      } else if (value.startsWith('group_')) {
                        setFormData({ 
                          ...formData, 
                          client_id: '', 
                          client_group_id: value.replace('group_', '') 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          client_id: value, 
                          client_group_id: '' 
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client or group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_selection">Select Client or Group</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                      {clientGroups.map((group) => (
                        <SelectItem key={group.id} value={`group_${group.id}`}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Delete Confirmation */}
          {action === 'delete' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800 dark:text-red-200">
                  Confirm Deletion
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                {scope === 'single' 
                  ? 'This will permanently delete this trip instance.'
                  : 'This will permanently delete this trip and all future instances of this recurring trip.'
                }
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              variant={action === 'delete' ? 'destructive' : 'default'}
              disabled={modifyMutation.isPending || deleteMutation.isPending}
            >
              {modifyMutation.isPending || deleteMutation.isPending 
                ? 'Processing...' 
                : action === 'delete' 
                  ? 'Delete Trip' 
                  : 'Save Changes'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}