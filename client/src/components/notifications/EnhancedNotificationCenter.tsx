import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, Car, MapPin, User, Settings, Filter, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { useWebSocket } from "../../hooks/useWebSocket";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'trip' | 'driver' | 'system' | 'client' | 'billing' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
}

interface NotificationPreferences {
  categories: {
    trip: boolean;
    driver: boolean;
    system: boolean;
    client: boolean;
    billing: boolean;
    maintenance: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface EnhancedNotificationCenterProps {
  className?: string;
}

export default function EnhancedNotificationCenter({ className }: EnhancedNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    categories: {
      trip: true,
      driver: true,
      system: true,
      client: true,
      billing: true,
      maintenance: true,
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      urgent: true,
    },
    channels: {
      inApp: true,
      email: false,
      sms: false,
      push: false,
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
  });

  // WebSocket connection for real-time notifications
  const { isConnected, connectionStatus } = useWebSocket({
    enabled: true,
    onMessage: (message) => {
      // Reduced logging to prevent console spam - only log in development and only important messages
      if (import.meta.env.DEV && (message.type === 'trip_created' || message.type === 'trip_update')) {
        console.log('📬 EnhancedNotificationCenter: Received WebSocket message:', message.type);
      }
      // console.log('📬 Full message data:', JSON.stringify(message, null, 2)); // Disabled to reduce console spam
      
      // Handle different WebSocket event types
      if (message.type === 'trip_created') {
        // console.log('🎯 Processing trip_created notification...'); // Disabled to reduce console spam
        const trip = message.data;
        const clientName = trip.clients 
          ? `${trip.clients.first_name || ''} ${trip.clients.last_name || ''}`.trim() 
          : trip.client_name || 'Unknown Client';
        
        // console.log('📬 Creating trip_created notification:', { // Disabled to reduce console spam
        //   clientName,
        //   tripId: trip.id,
        //   programId: trip.program_id,
        //   driverId: trip.driver_id
        // });
        
        addNotification({
          type: 'info',
          title: 'New Trip Created',
          message: `A new trip has been created${trip.driver_id ? ' and assigned to a driver' : ''} for ${clientName}`,
          category: 'trip',
          priority: 'high',
          data: trip
        });
        
        // console.log('✅ Notification added successfully'); // Disabled to reduce console spam
      } else if (message.type === 'trip_update') {
        const trip = message.data;
        const clientName = trip.clients 
          ? `${trip.clients.first_name || ''} ${trip.clients.last_name || ''}`.trim() 
          : trip.client_name || 'Unknown Client';
        
        // Use enhanced notification fields from server if available
        const title = trip.notificationTitle || (trip.statusChange ? `Trip ${trip.statusChange}` : 'Trip Updated');
        let messageText = trip.notificationMessage || trip.message || `Trip for ${clientName} has been updated`;
        
        // Add driver context if driver made the update (for admin notifications)
        if (trip.driverName && trip.updatedByRole === 'driver') {
          messageText = `${trip.driverName}: ${messageText}`;
        }
        
        // Handle different action types
        if (trip.action === 'assignment') {
          messageText = trip.driverName 
            ? `Trip assigned to ${trip.driverName}`
            : 'Trip assigned to driver';
        } else if (trip.action === 'modification') {
          messageText = `Trip details updated${trip.driverName ? ` by ${trip.driverName}` : ''}`;
        } else if (trip.action === 'cancellation') {
          messageText = `Trip cancelled${trip.driverName ? ` by ${trip.driverName}` : ''}`;
        }
        
        // Determine notification type based on status and action
        let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info';
        if (trip.status === 'completed') {
          notificationType = 'success';
        } else if (trip.status === 'cancelled' || trip.status === 'no_show' || trip.action === 'cancellation') {
          notificationType = 'warning';
        } else if (trip.status === 'in_progress') {
          notificationType = 'info';
        } else if (trip.action === 'assignment') {
          notificationType = 'info';
        }
        
        addNotification({
          type: notificationType,
          title: title,
          message: messageText + (clientName !== 'Unknown Client' ? ` - ${clientName}` : ''),
          category: 'trip',
          priority: trip.status === 'completed' || trip.status === 'cancelled' || trip.action === 'cancellation' 
            ? 'high' 
            : (trip.status === 'in_progress' || trip.action === 'assignment' ? 'medium' : 'low'),
          data: trip
        });
      } else if (message.type === 'driver_update') {
        addNotification({
          type: 'info',
          title: 'Driver Update',
          message: message.data?.message || 'Driver information has been updated',
          category: 'driver',
          priority: 'medium',
          data: message.data
        });
      } else if (message.type === 'client_update') {
        addNotification({
          type: 'info',
          title: 'Client Update',
          message: message.data?.message || 'Client information has been updated',
          category: 'client',
          priority: 'medium',
          data: message.data
        });
      } else if (message.type === 'system_update') {
        addNotification({
          type: message.data?.severity === 'error' ? 'error' : 'warning',
          title: 'System Alert',
          message: message.data?.message || 'System update',
          category: 'system',
          priority: message.data?.priority || 'medium',
          data: message.data
        });
      }
    }
  });

  // Mock notifications DISABLED - only show real WebSocket notifications
  // Commented out to prevent interference with real notifications
  // useEffect(() => {
  //   // Mock notifications removed - only show real notifications from WebSocket
  // }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    // Reduced logging to prevent console spam
    // console.log('📬 addNotification called:', {
    //   title: newNotification.title,
    //   message: newNotification.message,
    //   category: newNotification.category,
    //   id: newNotification.id
    // });

    setNotifications(prev => {
      // Filter out any mock notifications when adding real ones
      const filtered = prev.filter(n => !n.id?.startsWith('mock-'));
      const updated = [newNotification, ...filtered];
      // console.log('📬 Updated notifications array:', { // Disabled to reduce console spam
      //   before: prev.length,
      //   after: updated.length,
      //   filteredMocks: prev.length - filtered.length,
      //   newNotificationId: newNotification.id,
      //   newNotificationTitle: newNotification.title
      // });
      return updated;
    });
    setUnreadCount(prev => {
      // Count unread from the new notifications array (excluding mocks)
      const newCount = prev + 1;
      // console.log('📬 Updated unread count:', prev, '→', newCount); // Disabled to reduce console spam
      return newCount;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  const getIcon = (type: string, category: string) => {
    if (category === 'trip') return <MapPin className="h-4 w-4" />;
    if (category === 'driver') return <Car className="h-4 w-4" />;
    if (category === 'client') return <User className="h-4 w-4" />;
    if (category === 'billing') return <CheckCircle className="h-4 w-4" />;
    if (category === 'maintenance') return <Settings className="h-4 w-4" />;
    
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trip': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'driver': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'system': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'client': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'billing': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'maintenance': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || notification.category === selectedCategory;
    const matchesPriority = selectedPriority === "all" || notification.priority === selectedPriority;
    const matchesPreferences = preferences.categories[notification.category] && 
                              preferences.priorities[notification.priority];

    return matchesSearch && matchesCategory && matchesPriority && matchesPreferences;
  });

  const updatePreferences = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateCategoryPreference = (category: keyof NotificationPreferences['categories'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  const updatePriorityPreference = (priority: keyof NotificationPreferences['priorities'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [priority]: value
      }
    }));
  };

  const updateChannelPreference = (channel: keyof NotificationPreferences['channels'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: value
      }
    }));
  };

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        style={{ backgroundColor: 'var(--muted)' }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark All Read
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="space-y-4 p-4">
                  {/* Search and Filters */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                      >
                        <option value="all">All Categories</option>
                        <option value="trip">Trips</option>
                        <option value="driver">Drivers</option>
                        <option value="system">System</option>
                        <option value="client">Clients</option>
                        <option value="billing">Billing</option>
                        <option value="maintenance">Maintenance</option>
                      </select>

                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                      >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No notifications found
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notification.read 
                              ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`${getTypeColor(notification.type)} mt-1`}>
                              {getIcon(notification.type, notification.category)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-1">
                                  <Badge className={`text-xs ${getCategoryColor(notification.category)}`}>
                                    {notification.category}
                                  </Badge>
                                  <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {notification.timestamp.toLocaleTimeString()}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 p-4">
                  <div className="space-y-6">
                    {/* Category Preferences */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Notification Categories
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(preferences.categories).map(([category, enabled]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {category}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(value) => updateCategoryPreference(category as keyof NotificationPreferences['categories'], value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Priority Preferences */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Priority Levels
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(preferences.priorities).map(([priority, enabled]) => (
                          <div key={priority} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {priority}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(value) => updatePriorityPreference(priority as keyof NotificationPreferences['priorities'], value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Channel Preferences */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Notification Channels
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(preferences.channels).map(([channel, enabled]) => (
                          <div key={channel} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {channel === 'inApp' ? 'In-App' : channel.toUpperCase()}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(value) => updateChannelPreference(channel as keyof NotificationPreferences['channels'], value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quiet Hours */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Quiet Hours
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Enable Quiet Hours
                          </span>
                          <Switch
                            checked={preferences.quietHours.enabled}
                            onCheckedChange={(value) => updatePreferences('quietHours', { ...preferences.quietHours, enabled: value })}
                          />
                        </div>
                        
                        {preferences.quietHours.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">Start Time</label>
                              <input
                                type="time"
                                value={preferences.quietHours.start}
                                onChange={(e) => updatePreferences('quietHours', { ...preferences.quietHours, start: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">End Time</label>
                              <input
                                type="time"
                                value={preferences.quietHours.end}
                                onChange={(e) => updatePreferences('quietHours', { ...preferences.quietHours, end: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}







