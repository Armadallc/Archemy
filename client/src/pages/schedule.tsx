import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, User, Car, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";

interface DriverSchedule {
  id: string;
  driver_id: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  driver_name?: string;
}

interface Trip {
  id: string;
  client_id: string;
  driver_id: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  passenger_count: number;
  clients?: {
    first_name: string;
    last_name: string;
  };
  drivers?: {
    users: {
      user_name: string;
    };
  };
}

export default function Schedule() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Fetch driver schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/driver-schedules", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/driver-schedules/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch trips for selected date
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips/date", selectedDate, currentOrganization?.id],
    queryFn: async () => {
      if (user?.role === 'super_admin') {
        const response = await apiRequest("GET", `/api/super-admin/trips`);
        const allTrips = await response.json();
        return allTrips.filter((trip: Trip) => {
          const tripDate = trip.scheduled_pickup_time?.split('T')[0];
          return tripDate === selectedDate && trip.organization_id === currentOrganization?.id;
        });
      } else {
        const response = await apiRequest("GET", `/api/trips/organization/${currentOrganization?.id}`);
        const allTrips = await response.json();
        return allTrips.filter((trip: Trip) => {
          const tripDate = trip.scheduled_pickup_time?.split('T')[0];
          return tripDate === selectedDate;
        });
      }
    },
    enabled: !!currentOrganization?.id && !!selectedDate,
  });

  const isLoading = schedulesLoading || tripsLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SCHEDULE MANAGEMENT</h1>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(value: 'daily' | 'weekly') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selector and Trip Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Schedule - {format(parseISO(selectedDate), 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="date">Select Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading schedule...</div>
              ) : trips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No trips scheduled for this date
                </div>
              ) : (
                <div className="space-y-4">
                  {trips
                    .sort((a, b) => a.scheduled_pickup_time.localeCompare(b.scheduled_pickup_time))
                    .map((trip) => (
                      <div key={trip.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')}
                                {trip.scheduled_return_time && 
                                  ` - ${format(parseISO(trip.scheduled_return_time), 'h:mm a')}`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>
                                {trip.clients?.first_name} {trip.clients?.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <span>{trip.drivers?.users?.user_name || 'Unassigned'}</span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(trip.status)}>
                            {trip.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">From: {trip.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">To: {trip.dropoff_address}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Passengers: {trip.passenger_count}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Driver Schedules */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Driver Schedules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schedulesLoading ? (
                <div className="text-center py-4">Loading schedules...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No driver schedules found
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg p-3">
                      <div className="font-medium mb-2">
                        {schedule.driver_name || 'Unknown Driver'}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          {format(parseISO(`2000-01-01T${schedule.start_time}`), 'h:mm a')} - {' '}
                          {format(parseISO(`2000-01-01T${schedule.end_time}`), 'h:mm a')}
                        </div>
                        <div>
                          Days: {schedule.days_of_week?.join(', ') || 'Not specified'}
                        </div>
                      </div>
                      <Badge 
                        className={schedule.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }
                      >
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
