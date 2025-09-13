import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Navigation } from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { openNavigation, validateAddressForNavigation } from "@/lib/navigation";

interface Trip {
  id: string;
  client_name: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  trip_type: string;
  passenger_count: number;
  notes?: string;
}

interface DriverTripCardProps {
  trip: Trip;
  onStatusUpdate: () => void;
  previousStatus?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-purple-100 text-purple-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusButtons = (currentStatus: string) => {
  switch (currentStatus) {
    case 'scheduled':
      return [
        { status: 'confirmed', label: 'Confirm Trip', variant: 'default' as const },
        { status: 'cancelled', label: 'Cancel', variant: 'destructive' as const }
      ];
    case 'confirmed':
      return [
        { status: 'in_progress', label: 'Start Trip', variant: 'default' as const },
        { status: 'cancelled', label: 'Cancel', variant: 'destructive' as const }
      ];
    case 'in_progress':
      return [
        { status: 'completed', label: 'Complete Trip', variant: 'default' as const }
      ];
    case 'completed':
      return [];
    case 'cancelled':
      return [];
    default:
      return [];
  }
};

export default function DriverTripCard({ trip, onStatusUpdate, previousStatus }: DriverTripCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const { toast } = useToast();

  // Highlight card when status changes
  useEffect(() => {
    if (previousStatus && previousStatus !== trip.status) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [trip.status, previousStatus]);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await apiRequest("PUT", `/api/trips/${trip.id}/status`, {
        status: newStatus
      });

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Trip status changed to ${newStatus}`,
        });
        onStatusUpdate();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update trip status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNavigation = () => {
    if (!trip.pickup_address || !trip.dropoff_address) {
      toast({
        title: "Navigation Error",
        description: "Missing pickup or dropoff address",
        variant: "destructive",
      });
      return;
    }

    // Validate addresses before opening navigation
    const pickupValidation = validateAddressForNavigation(trip.pickup_address);
    const dropoffValidation = validateAddressForNavigation(trip.dropoff_address);

    if (!pickupValidation.isValid || !dropoffValidation.isValid) {
      toast({
        title: "Navigation Warning",
        description: "Addresses may be incomplete - navigation may not be accurate",
      });
    }

    openNavigation(trip.pickup_address, trip.dropoff_address);
    
    toast({
      title: "Opening Navigation",
      description: "Launching maps app with directions",
    });
  };

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), "h:mm a");
    } catch {
      return timeString;
    }
  };

  const formatDate = (timeString: string) => {
    try {
      return format(parseISO(timeString), "MMM d, yyyy");
    } catch {
      return timeString;
    }
  };

  const statusButtons = getStatusButtons(trip.status);

  return (
    <Card className={`w-full transition-all duration-300 trip-card-mobile ${isHighlighted ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
            <User className="w-4 h-4 inline mr-2" />
            {trip.client_name}
          </CardTitle>
          <Badge className={`${getStatusColor(trip.status)} font-medium`}>
            {trip.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Details */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-green-600" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-gray-600">{trip.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-red-600" />
            <div>
              <p className="text-sm font-medium">Dropoff</p>
              <p className="text-sm text-gray-600">{trip.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{formatDate(trip.scheduled_pickup_time)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{formatTime(trip.scheduled_pickup_time)}</span>
          </div>
        </div>

        {/* Trip Type and Passenger Count */}
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Type: {trip.trip_type.replace('_', ' ')}</span>
          <span>Passengers: {trip.passenger_count}</span>
        </div>

        {/* Notes */}
        {trip.notes && (
          <div className="text-sm">
            <p className="font-medium">Notes:</p>
            <p className="text-gray-600">{trip.notes}</p>
          </div>
        )}

        {/* Navigation and Status Update Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {/* Navigation Button - Show for confirmed or in_progress trips */}
          {(trip.status === 'confirmed' || trip.status === 'in_progress') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigation}
              className="flex items-center gap-2 w-full"
            >
              <Navigation className="w-4 h-4" />
              Navigate to Pickup
            </Button>
          )}
          
          {/* Status Update Buttons */}
          {statusButtons.length > 0 && (
            <div className="flex gap-2">
              {statusButtons.map((button) => (
                <Button
                  key={button.status}
                  variant={button.variant}
                  size="sm"
                  onClick={() => handleStatusUpdate(button.status)}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? "Updating..." : button.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}