import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import ActivityModal from "./ActivityModal";
import { 
  Clock, 
  Car, 
  User, 
  MapPin, 
  AlertCircle, 
  CheckCircle,
  UserPlus,
  Calendar,
  Settings,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'trip_update' | 'trip_created' | 'driver_assigned' | 'trip_completed' | 'trip_cancelled' | 'client_added' | 'group_created' | 'system_update';
  title: string;
  description: string;
  timestamp: string;
  relatedId?: string;
  relatedType?: 'trip' | 'client' | 'driver' | 'group';
  priority: 'low' | 'medium' | 'high';
  status?: string;
  details?: string;
}

const activityIcons = {
  trip_update: Car,
  trip_created: Calendar,
  driver_assigned: User,
  trip_completed: CheckCircle,
  trip_cancelled: AlertCircle,
  client_added: UserPlus,
  group_created: User,
  system_update: Settings,
};

const activityColors = {
  trip_update: "text-blue-600",
  trip_created: "text-green-600", 
  driver_assigned: "text-purple-600",
  trip_completed: "text-green-600",
  trip_cancelled: "text-red-600",
  client_added: "text-blue-600",
  group_created: "text-indigo-600",
  system_update: "text-gray-600",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export default function RecentActivity() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch trips data based on hierarchy level
  const { data: trips = [] } = useQuery({
    queryKey: ["/api/trips", level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      if (!selectedProgram && !selectedCorporateClient) return [];
      
      let endpoint = "/api/trips";
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/trips/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/trips/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(selectedProgram || selectedCorporateClient),
  });

  // Fetch clients data based on hierarchy level
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      if (!selectedProgram && !selectedCorporateClient) return [];
      
      let endpoint = "/api/clients";
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/clients/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/clients/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(selectedProgram || selectedCorporateClient),
  });

  // Fetch client groups data based on hierarchy level
  const { data: clientGroups = [] } = useQuery({
    queryKey: ["/api/client-groups", level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      if (!selectedProgram && !selectedCorporateClient) return [];
      
      let endpoint = "/api/client-groups";
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/client-groups/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/client-groups/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(selectedProgram || selectedCorporateClient),
  });

  // Generate activity items from real data
  useEffect(() => {
    if (!selectedProgram && !selectedCorporateClient || (trips.length === 0 && clients.length === 0 && clientGroups.length === 0)) {
      return;
    }

    const generateActivities = () => {
      const activityItems: ActivityItem[] = [];
      const now = new Date();
      
      // Trip-based activities (recent trips and status changes)
      trips.slice(0, 8).forEach((trip: any) => {
        const tripDate = new Date(trip.created_at);
        const scheduledDate = new Date(trip.scheduled_pickup_time);
        
        // Trip creation activity
        activityItems.push({
          id: `trip_created_${trip.id}`,
          type: 'trip_created',
          title: 'New trip scheduled',
          description: `Trip to ${trip.dropoff_address?.substring(0, 30)}...`,
          timestamp: trip.created_at,
          relatedId: trip.id,
          relatedType: 'trip',
          priority: 'medium',
          status: trip.status
        });

        // Driver assignment if driver is assigned
        if (trip.driver_id && trip.driver_name) {
          const assignmentTime = new Date(tripDate.getTime() + Math.random() * 3600000); // Random time after creation
          activityItems.push({
            id: `driver_assigned_${trip.id}`,
            type: 'driver_assigned',
            title: 'Driver assigned',
            description: `${trip.driver_name} assigned to trip`,
            timestamp: assignmentTime.toISOString(),
            relatedId: trip.id,
            relatedType: 'trip',
            priority: 'low'
          });
        }

        // Trip status updates based on current status
        if (trip.status === 'completed') {
          const completionTime = new Date(scheduledDate.getTime() + 3600000); // 1 hour after scheduled
          activityItems.push({
            id: `trip_completed_${trip.id}`,
            type: 'trip_completed',
            title: 'Trip completed',
            description: `Successfully completed pickup for ${trip.client_name || 'client'}`,
            timestamp: completionTime.toISOString(),
            relatedId: trip.id,
            relatedType: 'trip',
            priority: 'low'
          });
        }

        if (trip.status === 'cancelled') {
          activityItems.push({
            id: `trip_cancelled_${trip.id}`,
            type: 'trip_cancelled',
            title: 'Trip cancelled',
            description: `Trip cancelled - ${trip.client_name || 'Client'}`,
            timestamp: new Date(tripDate.getTime() + 1800000).toISOString(), // 30 min after creation
            relatedId: trip.id,
            relatedType: 'trip',
            priority: 'high'
          });
        }

        if (trip.status === 'in_progress') {
          activityItems.push({
            id: `trip_progress_${trip.id}`,
            type: 'trip_update',
            title: 'Trip in progress',
            description: `Driver en route to pickup location`,
            timestamp: scheduledDate.toISOString(),
            relatedId: trip.id,
            relatedType: 'trip',
            priority: 'medium'
          });
        }
      });

      // Client registration activities (recent clients)
      clients.slice(0, 3).forEach((client: any) => {
        activityItems.push({
          id: `client_added_${client.id}`,
          type: 'client_added',
          title: 'New client registered',
          description: `${client.firstName} ${client.lastName} added to system`,
          timestamp: client.createdAt || client.created_at,
          relatedId: client.id,
          relatedType: 'client',
          priority: 'low'
        });
      });

      // Client group activities
      clientGroups.forEach((group: any) => {
        activityItems.push({
          id: `group_created_${group.id}`,
          type: 'group_created',
          title: 'Client group created',
          description: `${group.name} created with ${group.clientCount || 0} clients`,
          timestamp: group.created_at,
          relatedId: group.id,
          relatedType: 'group',
          priority: 'low'
        });
      });

      // System activities (simulated based on real data patterns)
      if (trips.length > 0) {
        const recentTrip = trips[0];
        const systemTime = new Date(new Date(recentTrip.created_at).getTime() - 300000); // 5 min before recent trip
        
        activityItems.push({
          id: 'system_update_recent',
          type: 'system_update',
          title: 'System maintenance completed',
          description: 'Real-time trip tracking updated',
          timestamp: systemTime.toISOString(),
          priority: 'low'
        });
      }

      // Sort by timestamp (newest first) and limit to 12 items
      return activityItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 12);
    };

    setActivities(generateActivities());
  }, [trips.length, clients.length, clientGroups.length, selectedProgram, selectedCorporateClient]);

  const getRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    const IconComponent = activityIcons[type];
    return <IconComponent className={`w-4 h-4 ${activityColors[type]}`} />;
  };

  const handleActivityClick = (activity: ActivityItem) => {
    // In a real implementation, this would navigate to relevant page
    console.log("Activity clicked:", activity);
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No recent activity to display.</p>
            <p className="text-sm mt-1">Activity will appear here as trips are created and updated.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </div>
          <Badge variant="outline" className="text-xs">
            {activities.length} updates
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => handleActivityClick(activity)}
            >
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                  </div>
                  
                  {activity.priority === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      Priority
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {getRelativeTime(activity.timestamp)}
                  </span>
                  
                  {activity.status && (
                    <Badge variant="outline" className="text-xs">
                      {activity.status.replace('_', ' ')}
                    </Badge>
                  )}
                  
                  {activity.relatedId && (
                    <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length >= 12 && (
          <div className="pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setIsModalOpen(true)}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View all activity
            </Button>
          </div>
        )}
        
        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activities={activities}
        />
      </CardContent>
    </Card>
  );
}