import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Calendar, Clock, User, Car, MapPin, Plus, Edit, Trash2, Building2, Users } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
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
  
  // Related data
  driver?: {
    id: string;
    users: {
      user_name: string;
      first_name: string;
      last_name: string;
    };
  };
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
  program_id: string;
  
  // Related data
  clients?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  drivers?: {
    users: {
      user_name: string;
      first_name: string;
      last_name: string;
    };
  };
  programs?: {
    id: string;
    name: string;
    corporate_client_id: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
}

export default function Schedule() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, getPageTitle } = useHierarchy();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Get filter parameters based on current hierarchy level
  const filterParams = getFilterParams();

  // Fetch driver schedules based on current hierarchy level
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/driver-schedules", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/driver-schedules";
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/driver-schedules/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/driver-schedules/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Fetch trips for selected date based on current hierarchy level
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips/date", selectedDate, level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/trips";
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/trips/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/trips/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const allTrips = await response.json();
      
      // Filter trips by selected date
      return allTrips.filter((trip: Trip) => {
        const tripDate = trip.scheduled_pickup_time?.split('T')[0];
        return tripDate === selectedDate;
      });
    },
    enabled: !!selectedDate,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Car className="w-4 h-4" />;
      case 'completed': return <Calendar className="w-4 h-4" />;
      case 'cancelled': return <Trash2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SCHEDULE MANAGEMENT</h1>
          <p className="text-gray-600 mt-1">{getPageTitle()}</p>
        </div>
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
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No trips scheduled for this date</p>
                  <p className="text-sm">Trips will appear here when scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip: Trip) => (
                    <div key={trip.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(trip.status)}
                          <div>
                            <div className="font-medium">
                              {trip.clients?.first_name} {trip.clients?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')}
                              {trip.scheduled_return_time && (
                                <span> - {format(parseISO(trip.scheduled_return_time), 'h:mm a')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(trip.status)}>
                            {trip.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {trip.passenger_count} passenger{trip.passenger_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-green-700">Pickup</div>
                            <div className="text-sm text-gray-600">{trip.pickup_address}</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-red-700">Dropoff</div>
                            <div className="text-sm text-gray-600">{trip.dropoff_address}</div>
                          </div>
                        </div>
                      </div>

                      {trip.drivers && (
                        <div className="mt-3 flex items-center space-x-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <div className="text-sm">
                            <span className="font-medium">Driver: </span>
                            <span>{trip.drivers.users.first_name} {trip.drivers.users.last_name}</span>
                            <span className="text-gray-500 ml-2">({trip.drivers.users.user_name})</span>
                          </div>
                        </div>
                      )}

                      {trip.programs && (
                        <div className="mt-2 flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-purple-500" />
                          <div className="text-sm">
                            <span className="font-medium">Program: </span>
                            <span>{trip.programs.name}</span>
                            {trip.programs.corporateClient && (
                              <span className="text-gray-500 ml-2">({trip.programs.corporateClient.name})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Driver Schedules Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Driver Schedules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schedulesLoading ? (
                <div className="text-center py-4">Loading schedules...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No driver schedules</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule: DriverSchedule) => (
                    <div key={schedule.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {schedule.driver?.users?.first_name} {schedule.driver?.users?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.driver?.users?.user_name}
                          </div>
                        </div>
                        <Badge variant={schedule.is_active ? "default" : "secondary"}>
                          {schedule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(parseISO(schedule.start_time), 'h:mm a')} - {format(parseISO(schedule.end_time), 'h:mm a')}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">Days: </span>
                          <span>{schedule.days_of_week.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Today's Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Trips</span>
                  <span className="font-medium">{trips.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Scheduled</span>
                  <span className="font-medium text-blue-600">
                    {trips.filter((trip: Trip) => trip.status === 'scheduled').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="font-medium text-yellow-600">
                    {trips.filter((trip: Trip) => trip.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {trips.filter((trip: Trip) => trip.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Drivers</span>
                  <span className="font-medium">
                    {schedules.filter((schedule: DriverSchedule) => schedule.is_active).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}