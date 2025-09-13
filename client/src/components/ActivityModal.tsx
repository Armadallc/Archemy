import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Search,
  Filter,
  Download,
  X
} from "lucide-react";
import { format, startOfDay, endOfDay, isToday, isYesterday, isThisWeek } from "date-fns";

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

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
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

const typeLabels = {
  trip_update: "Trip Updates",
  trip_created: "Trip Bookings",
  driver_assigned: "Driver Assignments",
  trip_completed: "Completed Trips",
  trip_cancelled: "Cancellations",
  client_added: "New Clients",
  group_created: "Group Management",
  system_update: "System Events",
};

export default function ActivityModal({ isOpen, onClose, activities }: ActivityModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || activity.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || activity.priority === priorityFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const activityDate = new Date(activity.timestamp);
      switch (dateFilter) {
        case "today":
          matchesDate = isToday(activityDate);
          break;
        case "yesterday":
          matchesDate = isYesterday(activityDate);
          break;
        case "week":
          matchesDate = isThisWeek(activityDate);
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesPriority && matchesDate;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    // Skip activities with invalid timestamps
    if (!activity.timestamp) return groups;
    
    const activityDate = new Date(activity.timestamp);
    if (isNaN(activityDate.getTime())) return groups;
    
    const date = startOfDay(activityDate).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    const IconComponent = activityIcons[type];
    return <IconComponent className={`w-4 h-4 ${activityColors[type]}`} />;
  };

  const getActivityTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const exportActivities = () => {
    const csvContent = [
      ['Date', 'Time', 'Type', 'Title', 'Description', 'Priority', 'Status'].join(','),
      ...filteredActivities.map(activity => [
        format(new Date(activity.timestamp), 'yyyy-MM-dd'),
        format(new Date(activity.timestamp), 'HH:mm:ss'),
        typeLabels[activity.type] || activity.type,
        `"${activity.title}"`,
        `"${activity.description}"`,
        activity.priority,
        activity.status || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Activity Log
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredActivities.length} of {activities.length} activities
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={exportActivities}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || typeFilter !== "all" || priorityFilter !== "all" || dateFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setPriorityFilter("all");
                setDateFilter("all");
              }}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {Object.keys(groupedActivities).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No activities found</p>
              <p className="text-sm">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            Object.entries(groupedActivities)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayActivities]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {getDateLabel(date)}
                    </h3>
                    <Separator className="flex-1" />
                    <Badge variant="outline" className="text-xs">
                      {dayActivities.length} activities
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {dayActivities
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {activity.title}
                                  </h4>
                                  {activity.priority === 'high' && (
                                    <Badge variant="destructive" className="text-xs">
                                      High Priority
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {activity.description}
                                </p>
                                {activity.details && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {activity.details}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-gray-500 font-mono">
                                  {getActivityTime(activity.timestamp)}
                                </span>
                                {activity.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.status.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {typeLabels[activity.type] || activity.type}
                              </Badge>
                              {activity.relatedId && (
                                <Badge variant="outline" className="text-xs text-blue-600">
                                  ID: {activity.relatedId.substring(0, 8)}...
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            Last updated: {activities.length > 0 ? format(new Date(activities[0].timestamp), "MMM d, h:mm a") : "Never"}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}