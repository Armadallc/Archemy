import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Car,
  Route,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";
import TripCreationDialog from "@/components/TripCreationDialog";
import RecurringTripModifyDialog from "@/components/RecurringTripModifyDialog";

interface Trip {
  id: string;
  organization_id: string;
  client_id?: string;
  client_group_id?: string;
  driver_id?: string | null;
  trip_type: "one_way" | "round_trip";
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string | null;
  actual_pickup_time?: string | null;
  actual_dropoff_time?: string | null;
  actual_return_time?: string | null;
  passenger_count: number;
  special_requirements?: string | null;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes?: string | null;
  created_at: string;
  recurring_trip_id?: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
  group_name?: string;
  updated_at: string;
  // Joined data
  client_name?: string;
  driver_name?: string;
}

const statusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-green-50 text-green-700 border-green-200", 
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-gray-50 text-gray-700 border-gray-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function Trips() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedBookingOrganization, setSelectedBookingOrganization] = useState("");
  const [selectedRecurringTrip, setSelectedRecurringTrip] = useState<Trip | null>(null);
  const [isRecurringModifyOpen, setIsRecurringModifyOpen] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Determine which organization to fetch data for
  const targetOrganization = user?.role === 'organization_user' && selectedBookingOrganization 
    ? selectedBookingOrganization 
    : currentOrganization?.id;

  console.log("User role:", user?.role);
  console.log("Selected booking org:", selectedBookingOrganization);
  console.log("Current organization:", currentOrganization);
  console.log("Target organization:", targetOrganization);

  // Fetch trips
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips", targetOrganization, user?.role],
    queryFn: async () => {
      if (!targetOrganization) return [];
      const response = await apiRequest("GET", `/api/trips/organization/${targetOrganization}`);
      return await response.json();
    },
    enabled: !!targetOrganization,
  });

  console.log("Target organization for trips:", targetOrganization);

  // Fetch drivers for assignment
  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers", targetOrganization],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/organization/${targetOrganization}`);
      return await response.json();
    },
    enabled: !!targetOrganization && isAssignDriverDialogOpen,
  });

  const availableDrivers = Array.isArray(driversData) ? driversData : [];

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      return apiRequest("DELETE", `/api/trips/${tripId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trip",
        variant: "destructive",
      });
    },
  });

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return apiRequest("PATCH", `/api/trips/${selectedTripId}/assign-driver`, {
        driverId: driverId
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver assigned successfully",
      });
      setIsAssignDriverDialogOpen(false);
      setSelectedTripId("");
      setSelectedDriverId("");
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign driver",
        variant: "destructive",
      });
    },
  });

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.scheduled;
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredTrips = trips.filter((trip: Trip) => {
    const matchesSearch = trip.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.dropoff_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.driver_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todaysTrips = trips.filter((trip: Trip) => 
    new Date(trip.scheduled_pickup_time).toDateString() === new Date().toDateString()
  ).length;
  
  const inProgressTrips = trips.filter((trip: Trip) => trip.status === "in_progress").length;
  const completedTrips = trips.filter((trip: Trip) => trip.status === "completed").length;

  if (tripsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">TRIP MANAGEMENT</h1>
        </div>
        <div className="flex gap-2">
          <TripCreationDialog
            trigger={
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Trip
              </Button>
            }
            selectedBookingOrganization={selectedBookingOrganization}
            onOrganizationChange={setSelectedBookingOrganization}
          />
          
          <Button 
            variant="outline"
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/recurring-trips';
              link.click();
            }}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Recurring Trips
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Today's Trips</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{todaysTrips}</div>
            <p className="text-xs text-blue-600 mt-1">Scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">In Progress</CardTitle>
            <Car className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{inProgressTrips}</div>
            <p className="text-xs text-yellow-600 mt-1">Currently active</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Completed</CardTitle>
            <Clock className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{completedTrips}</div>
            <p className="text-xs text-green-600 mt-1">Successfully finished</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Trips</CardTitle>
            <Route className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{trips.length}</div>
            <p className="text-xs text-purple-600 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No trips found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Details</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip: Trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="truncate max-w-40">{trip.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="truncate max-w-40">{trip.dropoff_address}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{trip.client_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{trip.driver_name || "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDateTime(trip.scheduled_pickup_time)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${statusColors[trip.status]} text-xs px-2 py-1 rounded-full font-medium border`}
                          >
                            {trip.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {trip.recurring_trip_id && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Recurring
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trip.status === 'scheduled' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedTripId(trip.id);
                                setIsAssignDriverDialogOpen(true);
                              }}
                              title="Assign Driver"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {trip.recurring_trip_id && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  setSelectedRecurringTrip(trip);
                                  setIsRecurringModifyOpen(true);
                                }}
                                title="Modify Recurring Trip"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedRecurringTrip({...trip, deleteMode: true});
                                  setIsRecurringModifyOpen(true);
                                }}
                                title="Delete Recurring Trip"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Delete Trip"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this trip? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTripMutation.mutate(trip.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Trip
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDriverDialogOpen} onOpenChange={setIsAssignDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver to Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="driver_select" className="text-sm font-medium">Select Driver</label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {driversLoading ? (
                    <SelectItem value="loading_drivers" disabled>Loading available drivers...</SelectItem>
                  ) : availableDrivers.length === 0 ? (
                    <SelectItem value="no_drivers" disabled>No available drivers for this time slot</SelectItem>
                  ) : (
                    availableDrivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user_name} - {driver.vehicle_info || 'No vehicle info'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAssignDriverDialogOpen(false);
                  setSelectedTripId("");
                  setSelectedDriverId("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => assignDriverMutation.mutate(selectedDriverId)}
                disabled={!selectedDriverId || assignDriverMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assignDriverMutation.isPending ? "Assigning..." : "Assign Driver"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring Trip Modify Dialog */}
      {selectedRecurringTrip && (
        <RecurringTripModifyDialog
          trip={selectedRecurringTrip}
          isOpen={isRecurringModifyOpen}
          onClose={() => {
            setIsRecurringModifyOpen(false);
            setSelectedRecurringTrip(null);
          }}
        />
      )}
    </div>
  );
}