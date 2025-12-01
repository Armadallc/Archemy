import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Filter, Tag, FileText, MessageSquare, User, Loader2 } from "lucide-react";
import { useActivityLog, type ActivityLogEntry } from "../../hooks/useActivityLog";
import { useAuth } from "../../hooks/useAuth";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { UserAvatar } from "../users/UserAvatar";
import { RoleBadge } from "../users/RoleBadge";

// Legacy static data for fallback (can be removed later)
const activityData = [
  {
    id: "1",
    type: "status_change",
    user: { name: "Angelina Gotelli", initials: "AG" },
    action: "has change",
    target: "PD-979",
    status: { text: "Completed", color: "green" },
    timestamp: "06:20 PM",
    date: "SUNDAY, 06 MARCH"
  },
  {
    id: "2",
    type: "comment",
    user: { name: "Max Alexander", initials: "MA", avatar: "/thoughtful-man.png" },
    action: "comment on your",
    target: "Post",
    comment:
      "Fine, Java MIGHT be a good example of what a programming language should be like. But Java applications are good examples of what applications SHOULDN'T be like.",
    timestamp: "05:53 PM",
    date: "SUNDAY, 06 MARCH"
  },
  {
    id: "3",
    type: "tag_added",
    user: { name: "Eugene Stewart", initials: "ES" },
    action: "added tags",
    tags: [
      { text: "Live Issue", color: "red" },
      { text: "Backend", color: "blue" }
    ],
    timestamp: "04:40 PM",
    date: "SUNDAY, 06 MARCH"
  },
  {
    id: "4",
    type: "file_added",
    user: { name: "Shannon Baker", initials: "SB" },
    action: "added",
    target: "document.csv",
    timestamp: "03:18 PM",
    date: "SUNDAY, 06 MARCH"
  },
  {
    id: "5",
    type: "mention",
    user: { name: "Roberta Horton", initials: "RH", avatar: "/diverse-woman-portrait.png" },
    action: "mentioned you in a comment",
    target: "Post",
    comment:
      "@Carolyn One of the main causes of the fall of the Roman Empire was that-lacking zero-they had no way to indicate successful termination of their C programs.",
    timestamp: "02:17 PM",
    date: "SUNDAY, 06 MARCH"
  },
  {
    id: "6",
    type: "assignment",
    user: { name: "Lee Wheeler", initials: "LW" },
    action: "assigned ticket",
    target: "PD-1092",
    assignee: "Alvin Moreno",
    timestamp: "11:13 AM",
    date: "SUNDAY, 06 MARCH"
  },
  {
    id: "7",
    type: "comment",
    user: { name: "Jessica Wells", initials: "JW", avatar: "/woman-flowers.jpg" },
    action: "comment on your",
    target: "Post",
    comment:
      "The trouble with programmers is that you can never tell what a programmer is doing until it's too late.",
    timestamp: "08:49 AM",
    date: "SATURDAY, 05 MARCH"
  },
  {
    id: "8",
    type: "status_change",
    user: { name: "Earl Miles", initials: "EM", avatar: "/man-beard.jpg" },
    action: "has change",
    target: "PD-977",
    status: { text: "In progress", color: "blue" },
    timestamp: "08:30 AM",
    date: "SATURDAY, 05 MARCH"
  }
];

const getStatusColor = (color: string) => {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "blue":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "red":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "orange":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

const getTagColor = (color: string) => {
  switch (color) {
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "tag_added":
      return <Tag className="text-muted-foreground h-4 w-4" />;
    case "file_added":
      return <FileText className="text-muted-foreground h-4 w-4" />;
    case "comment":
    case "mention":
      return <MessageSquare className="text-muted-foreground h-4 w-4" />;
    case "assignment":
      return <User className="text-muted-foreground h-4 w-4" />;
    default:
      return null;
  }
};

export default function ActivityFeed() {
  const { user } = useAuth();
  const [mentionsOnly, setMentionsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: activities, isLoading, error } = useActivityLog({
    limit: 50,
    mentionsOnly,
    enabled: !!user?.user_id,
  });

  // Debug logging
  React.useEffect(() => {
    if (error) {
      console.error('❌ [ActivityFeed] Error loading activities:', error);
    }
    if (isLoading) {
      console.log('🔄 [ActivityFeed] Loading activities...', { user_id: user?.user_id });
    }
    if (activities) {
      console.log('✅ [ActivityFeed] Loaded activities:', activities.length);
    }
  }, [error, isLoading, activities, user?.user_id]);

  // Format date for display
  const formatActivityDate = (dateString: string): string => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'TODAY';
    } else if (isYesterday(date)) {
      return 'YESTERDAY';
    } else {
      return format(date, 'EEEE, dd MMMM').toUpperCase();
    }
  };

  // Format time for display
  const formatActivityTime = (dateString: string): string => {
    const date = parseISO(dateString);
    return format(date, 'hh:mm a');
  };

  // Get activity icon based on activity type
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'task_created':
      case 'task_updated':
      case 'task_completed':
      case 'task_assigned':
        return <FileText className="text-muted-foreground h-4 w-4" />;
      case 'comment_created':
      case 'discussion_message':
        return <MessageSquare className="text-muted-foreground h-4 w-4" />;
      case 'user_mentioned':
      case 'user_tagged':
        return <Tag className="text-muted-foreground h-4 w-4" />;
      case 'kanban_card_created':
      case 'kanban_card_moved':
        return <FileText className="text-muted-foreground h-4 w-4" />;
      default:
        return <User className="text-muted-foreground h-4 w-4" />;
    }
  };

  // Get display name from user object (first_name + last_name, or fallback to user_name/email)
  const getUserDisplayName = (user: { first_name?: string | null; last_name?: string | null; user_name?: string; email?: string } | undefined): string => {
    if (!user) return 'Unknown User';
    
    if (user.first_name || user.last_name) {
      const nameParts = [user.first_name, user.last_name].filter(Boolean);
      if (nameParts.length > 0) {
        return nameParts.join(' ');
      }
    }
    
    return user.user_name || user.email || 'Unknown User';
  };

  // Get activity description text
  const getActivityDescription = (activity: ActivityLogEntry): string => {
    if (activity.action_description) {
      return activity.action_description;
    }

    switch (activity.activity_type) {
      case 'task_created':
        return 'created a task';
      case 'task_updated':
        return 'updated a task';
      case 'task_completed':
        return 'completed a task';
      case 'task_assigned':
        return 'assigned a task';
      case 'comment_created':
        return 'commented';
      case 'discussion_created':
        return 'started a discussion';
      case 'discussion_message':
        return 'posted a message';
      case 'note_created':
        return 'created a note';
      case 'user_mentioned':
        return 'mentioned you';
      case 'user_tagged':
        return 'tagged you';
      case 'kanban_card_created':
        return 'created a card';
      case 'kanban_card_moved':
        return 'moved a card';
      case 'trip_created':
        // Handle pluralization for recurring trips
        const tripCount = activity.metadata?.trip_count;
        if (tripCount && tripCount > 1) {
          return 'created trips';
        }
        return 'created a trip';
      default:
        return 'performed an action';
    }
  };

  // Get source type badge text (for display as tag)
  const getSourceTypeBadge = (sourceType: string): string => {
    switch (sourceType) {
      case 'trip':
        return 'trip';
      case 'task':
        return 'task';
      case 'comment':
        return 'comment';
      case 'note':
        return 'note';
      case 'discussion':
        return 'discussion';
      case 'kanban':
        return 'kanban';
      case 'client':
        return 'client';
      case 'user':
        return 'user';
      case 'file':
        return 'file';
      default:
        return sourceType;
    }
  };

  // Group activities by date
  const groupedActivities = React.useMemo(() => {
    if (!activities) return {};
    
    return activities.reduce((acc, activity) => {
      const dateKey = formatActivityDate(activity.created_at);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(activity);
      return acc;
    }, {} as Record<string, ActivityLogEntry[]>);
  }, [activities]);

  let currentDate = "";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading activities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="font-semibold">Failed to load activities</p>
          <p className="mt-2 text-sm">{errorMessage}</p>
          <p className="mt-2 text-xs opacity-75">
            Please check the browser console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center md:mb-8">
        <h1 className="text-foreground text-xl font-semibold md:text-2xl">Activity log</h1>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs md:text-sm">Show mentioned only</span>
            <Switch 
              checked={mentionsOnly}
              onCheckedChange={setMentionsOnly}
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4 md:space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>No activities found.</p>
            {mentionsOnly && (
              <p className="mt-2 text-sm">You haven't been mentioned in any activities yet.</p>
            )}
          </div>
        ) : (
          Object.entries(groupedActivities).map(([dateKey, dateActivities]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase md:mb-4 md:text-sm">
                {dateKey}
              </div>

              {/* Activities for this date */}
              {dateActivities.map((activity) => {
                const activityUser = activity.users || {
                  user_id: activity.user_id,
                  user_name: 'Unknown User',
                  email: '',
                  avatar_url: null,
                  role: 'program_user',
                };

                return (
                  <div key={activity.id} className="relative flex gap-2 md:gap-3 mb-4 md:mb-6">
                    {/* Timeline Line */}
                    <div className="bg-border absolute top-10 bottom-0 left-3 w-px md:top-12 md:left-4" />

                    {/* Avatar */}
                    <div className="relative z-10">
                      <UserAvatar
                        user={activityUser}
                        size="sm"
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-2 md:text-sm">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="text-foreground font-medium">
                            {getUserDisplayName(activityUser)}
                          </span>
                          <span className="text-muted-foreground">
                            {getActivityDescription(activity)}
                          </span>
                          {/* Show source type as badge/tag */}
                          <Badge 
                            variant="outline" 
                            className="text-xs font-normal"
                            style={{
                              borderColor: activity.source_type === 'trip' 
                                ? 'var(--in-progress)' 
                                : activity.source_type === 'task' 
                                  ? 'var(--cancelled)' 
                                  : undefined,
                              backgroundColor: activity.source_type === 'trip' 
                                ? 'var(--in-progress-bg)' 
                                : activity.source_type === 'task' 
                                  ? 'var(--cancelled-bg)' 
                                  : undefined,
                              color: (activity.source_type === 'trip' || activity.source_type === 'task') 
                                ? 'var(--foreground)' 
                                : undefined,
                            }}
                          >
                            ({getSourceTypeBadge(activity.source_type)})
                          </Badge>
                          {/* Show target user for assignments */}
                          {activity.target_user && (
                            <>
                              <span className="text-muted-foreground">for</span>
                              <span className="text-foreground font-medium">
                                {getUserDisplayName(activity.target_user)}
                              </span>
                            </>
                          )}
                          {activity.metadata?.target_user_id && !activity.target_user && (
                            <>
                              <span className="text-muted-foreground">for</span>
                              <span className="text-foreground font-medium">
                                {activity.metadata.target_user_id}
                              </span>
                            </>
                          )}
                          {/* Show client/group for trip activities */}
                          {activity.source_type === 'trip' && activity.metadata && (
                            <>
                              {(activity.metadata.client_name || activity.metadata.client_group_name) && (
                                <>
                                  <span className="text-muted-foreground">for</span>
                                  {activity.metadata.client_name && (
                                    <>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs font-normal"
                                        style={{
                                          borderColor: 'var(--status-info)',
                                          backgroundColor: 'var(--status-info-bg)',
                                          color: 'var(--foreground)',
                                        }}
                                      >
                                        (client)
                                      </Badge>
                                      <span className="text-foreground font-medium">
                                        {activity.metadata.client_name}
                                      </span>
                                    </>
                                  )}
                                  {activity.metadata.client_group_name && (
                                    <>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs font-normal"
                                        style={{
                                          borderColor: 'var(--status-info)',
                                          backgroundColor: 'var(--status-info-bg)',
                                          color: 'var(--foreground)',
                                        }}
                                      >
                                        (clients)
                                      </Badge>
                                      <span className="text-foreground font-medium">
                                        {activity.metadata.client_group_name}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs sm:ml-auto md:text-sm">
                          {formatActivityTime(activity.created_at)}
                        </span>
                      </div>

                      {/* Mentioned Users */}
                      {activity.mentioned_users && activity.mentioned_users.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground text-xs">Mentioned:</span>
                          {activity.mentioned_users.map((user) => (
                            <Badge key={user.user_id} variant="outline" className="text-xs">
                              {getUserDisplayName(user)}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Fallback to metadata if mentioned_users not loaded */}
                      {activity.metadata?.mentioned_users && 
                       activity.metadata.mentioned_users.length > 0 && 
                       (!activity.mentioned_users || activity.mentioned_users.length === 0) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground text-xs">Mentioned:</span>
                          {activity.metadata.mentioned_users.map((userId) => (
                            <Badge key={userId} variant="outline" className="text-xs">
                              {userId}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Mentioned Roles */}
                      {activity.metadata?.mentioned_roles && activity.metadata.mentioned_roles.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground text-xs">Tagged roles:</span>
                          {activity.metadata.mentioned_roles.map((role) => (
                            <RoleBadge key={role} role={role as any} size="sm" />
                          ))}
                        </div>
                      )}

                      {/* Action Description Details */}
                      {activity.action_description && activity.action_description.length > 100 && (
                        <div className="bg-muted text-muted-foreground mt-2 rounded-lg p-2 text-xs leading-relaxed md:mt-3 md:p-3 md:text-sm">
                          {activity.action_description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


