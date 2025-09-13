import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";

interface Trip {
  id: string;
  clientName: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledTime: string;
  status: string;
}

const mockTrips: Trip[] = [
  {
    id: "1",
    clientName: "John Smith",
    pickupAddress: "100 N Tryon St",
    dropoffAddress: "Medical Center",
    scheduledTime: "09:00",
    status: "scheduled"
  },
  {
    id: "2", 
    clientName: "Mary Johnson",
    pickupAddress: "200 South Blvd",
    dropoffAddress: "Grocery Store",
    scheduledTime: "14:30",
    status: "confirmed"
  }
];

function TripCalendar() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTrips.map((trip) => (
            <div key={trip.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{trip.scheduledTime}</span>
                </div>
                <Badge className={getStatusColor(trip.status)}>
                  {trip.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="font-semibold">{trip.clientName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{trip.pickupAddress} → {trip.dropoffAddress}</span>
                </div>
              </div>
            </div>
          ))}

          {mockTrips.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No trips scheduled for today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { TripCalendar };
export default TripCalendar;