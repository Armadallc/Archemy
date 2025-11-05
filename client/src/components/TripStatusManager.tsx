import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  MapPin,
  User,
  Car
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";

interface Trip {
  id: string;
  status: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  pickup_address: string;
  dropoff_address: string;
  client_first_name: string;
  client_last_name: string;
  driver_name?: string;
  driver_id?: string;
  program_id: string;
}

interface TripStatusManagerProps {
  trip: Trip;
  onStatusUpdate?: (tripId: string, newStatus: string) => void;
  showDetails?: boolean;
  className?: string;
}

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
    nextActions: ["confirmed", "cancelled"]
  },
  confirmed: {
    label: "Confirmed", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    nextActions: ["in_progress", "cancelled"]
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: Play,
    nextActions: ["completed", "cancelled"]
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: CheckCircle,
    nextActions: []
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    nextActions: []
  }
};

export default function TripStatusManager({ 
  trip, 
  onStatusUpdate,
  showDetails = true,
  className = ""
}: TripStatusManagerProps) {
  const { user } = useAuth();
  const { level } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatus = statusConfig[trip.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const canUpdateStatus = currentStatus.nextActions.length > 0;

  // Check if user can update trip status
  const canUserUpdateStatus = () => {
    if (!user) return false;
    
    // Drivers can only update their own trips
    if (user.role === 'driver') {
      return trip.driver_id === user.user_id;
    }
    
    // Admins can update any trip
    return ['super_admin', 'corporate_admin', 'program_admin', 'program_user'].includes(user.role);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      // Use the generic PATCH endpoint which now includes status validation
      const response = await apiRequest('PATCH', `/api/trips/${trip.id}`, {
        status: newStatus,
        updated_by: user?.user_id,
        updated_at: new Date().toISOString()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If it's a validation error, show the specific message
        if (response.status === 400 && errorData.message) {
          throw new Error(errorData.message);
        }
        throw new Error('Failed to update trip status');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Status Updated",
        description: `Trip status updated to ${statusConfig[data.status as keyof typeof statusConfig]?.label}`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", level] });
      
      if (onStatusUpdate) {
        onStatusUpdate(trip.id, data.status);
      }
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update trip status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleStatusUpdate = async (newStatus: string) => {
    if (!canUserUpdateStatus()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update this trip status",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    updateStatusMutation.mutate(newStatus);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = () => {
    const IconComponent = currentStatus.icon;
    return <IconComponent className="h-4 w-4" />;
  };

  if (!canUserUpdateStatus() && !showDetails) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Trip Status
          </CardTitle>
          <Badge 
            className={`${currentStatus.color} border`}
          >
            {getStatusIcon()}
            <span className="ml-1">{currentStatus.label}</span>
          </Badge>
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Trip Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {trip.client_first_name} {trip.client_last_name}
                </span>
              </div>
              
              {trip.driver_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span>{trip.driver_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{trip.pickup_address}</div>
                  <div className="truncate text-gray-500">→ {trip.dropoff_address}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>
                  {formatTime(trip.scheduled_pickup_time)}
                  {trip.scheduled_return_time && (
                    <span className="text-gray-500">
                      {' - '}{formatTime(trip.scheduled_return_time)}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Status Actions */}
            {canUpdateStatus && canUserUpdateStatus() && (
              <div className="pt-2 border-t">
                <div className="flex flex-wrap gap-2">
                  {currentStatus.nextActions.map((action) => {
                    const actionConfig = statusConfig[action as keyof typeof statusConfig];
                    const ActionIcon = actionConfig.icon;
                    
                    return (
                      <Button
                        key={action}
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(action)}
                        disabled={isUpdating}
                        className="text-xs"
                      >
                        {isUpdating ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <ActionIcon className="h-3 w-3 mr-1" />
                        )}
                        {actionConfig.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Driver-specific actions */}
            {user?.role === 'driver' && trip.driver_id === user.user_id && (
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500">
                  You are assigned to this trip
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

