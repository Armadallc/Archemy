import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationPreferences, NotificationPreferences, NotificationType } from '../../services/notificationPreferences';

interface NotificationItem {
  id: string;
  type: 'trip_update' | 'new_trip' | 'emergency' | 'system' | 'trip_reminder';
  title: string;
  body: string;
  timestamp: string;
  read?: boolean;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  author?: {
    userId?: string;
    name?: string;
    role?: string;
  };
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const { 
    notifications, 
    clearNotifications, 
    markAsRead, 
    unreadCount,
    isConnected,
    connectionState 
  } = useNotifications();

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const prefs = await notificationPreferences.getPreferences();
      setPreferences(prefs);
    };
    loadPreferences();
  }, []);

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (key === 'emergency') {
      Alert.alert('Emergency Notifications', 'Emergency notifications cannot be disabled for your safety.');
      return;
    }

    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    
    try {
      await notificationPreferences.setPreferences({ [key]: value });
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences. Please try again.');
      // Revert on error
      setPreferences(preferences);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Notifications come via WebSocket, but we can trigger a query invalidation
    // to refresh any related data (trips, etc.)
    queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
    // Small delay to show refresh animation
    setTimeout(() => setRefreshing(false), 500);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip_update':
        return 'refresh';
      case 'new_trip':
        return 'car';
      case 'emergency':
        return 'warning';
      case 'system':
        return 'information-circle';
      case 'trip_reminder':
        return 'time';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'trip_update':
        return theme.colors.info;
      case 'new_trip':
        return theme.colors.success;
      case 'emergency':
        return theme.colors.error;
      case 'system':
        return theme.colors.mutedForeground;
      case 'trip_reminder':
        return theme.colors.warning;
      default:
        return theme.colors.mutedForeground;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.info;
      case 'low':
        return theme.colors.mutedForeground;
      default:
        return theme.colors.mutedForeground;
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'URGENT';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  };

  const getAuthorName = (author?: { name?: string; role?: string }) => {
    if (!author) return 'System';
    if (author.name) return author.name;
    if (author.role) return author.role.replace('_', ' ').toUpperCase();
    return 'System';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={24}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationText}>
            <View style={styles.notificationTitleRow}>
              <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
              {item.priority && (
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityBadgeText}>
                    {getPriorityLabel(item.priority)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.notificationBody} numberOfLines={2}>{item.body}</Text>
            {item.author && (
              <View style={styles.authorRow}>
                <Ionicons name="person-circle-outline" size={14} color={theme.colors.mutedForeground} />
                <Text style={styles.authorText}>
                  {getAuthorName(item.author)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.notificationMeta}>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={theme.colors.mutedForeground} />
      <Text style={styles.emptyText}>No notifications</Text>
      <Text style={styles.emptySubtext}>
        {isConnected ? 'You\'ll see notifications here when they arrive' : 'Connect to receive notifications'}
      </Text>
    </View>
  );

  const renderPreferencesSection = () => {
    if (!preferences) return null;

    const typeLabels = notificationPreferences.getNotificationTypeLabels();

    return (
      <View style={styles.preferencesSection}>
        <Text style={styles.preferencesTitle}>Notification Preferences</Text>
        
        {(['new_trip', 'trip_update', 'trip_reminder', 'emergency', 'system'] as NotificationType[]).map((type) => {
          const label = typeLabels[type];
          const key = type === 'new_trip' ? 'newTrip' 
            : type === 'trip_update' ? 'tripUpdate'
            : type === 'trip_reminder' ? 'tripReminder'
            : type === 'emergency' ? 'emergency'
            : 'system' as keyof NotificationPreferences;
          const isEnabled = preferences[key];
          const isEmergency = type === 'emergency';

          return (
            <View key={type} style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Ionicons 
                  name={label.icon as any} 
                  size={24} 
                  color={getNotificationColor(type)} 
                  style={styles.preferenceIcon}
                />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceLabel}>{label.label}</Text>
                  <Text style={styles.preferenceDescription}>{label.description}</Text>
                </View>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={(value) => handlePreferenceChange(key, value)}
                disabled={isEmergency}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={isEnabled ? theme.colors.primaryForeground : theme.colors.mutedForeground}
              />
            </View>
          );
        })}

        <View style={styles.preferenceDivider} />

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Ionicons 
              name="volume-high" 
              size={24} 
              color={theme.colors.primary} 
              style={styles.preferenceIcon}
            />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Sound</Text>
              <Text style={styles.preferenceDescription}>Play sound for notifications</Text>
            </View>
          </View>
          <Switch
            value={preferences.soundEnabled}
            onValueChange={(value) => handlePreferenceChange('soundEnabled', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={preferences.soundEnabled ? theme.colors.primaryForeground : theme.colors.mutedForeground}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Ionicons 
              name="phone-portrait" 
              size={24} 
              color={theme.colors.primary} 
              style={styles.preferenceIcon}
            />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Vibration</Text>
              <Text style={styles.preferenceDescription}>Vibrate for notifications</Text>
            </View>
          </View>
          <Switch
            value={preferences.vibrationEnabled}
            onValueChange={(value) => handlePreferenceChange('vibrationEnabled', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={preferences.vibrationEnabled ? theme.colors.primaryForeground : theme.colors.mutedForeground}
          />
        </View>
      </View>
    );
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    header: {
      backgroundColor: theme.colors.card,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      ...theme.typography.bodySmall,
      color: theme.colors.mutedForeground,
      fontWeight: '500',
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 6,
      marginRight: 8,
    },
    clearButtonText: {
      ...theme.typography.bodySmall,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    unreadBanner: {
      backgroundColor: theme.colors.infoBg,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    unreadText: {
      ...theme.typography.body,
      color: theme.colors.info,
      fontWeight: '600',
      marginLeft: 8,
    },
    listContainer: {
      flexGrow: 1,
    },
    notificationItem: {
      backgroundColor: theme.colors.card,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.colors.shadowOpacity,
      shadowRadius: 2,
      elevation: 2,
    },
    unreadNotification: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    notificationContent: {
      padding: 16,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationText: {
      flex: 1,
      marginLeft: 12,
    },
    notificationTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    notificationTitle: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '600',
      flex: 1,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    priorityBadgeText: {
      ...theme.typography.caption,
      color: theme.colors.primaryForeground,
      fontWeight: '700',
      fontSize: 9,
      letterSpacing: 0.5,
    },
    notificationBody: {
      ...theme.typography.bodySmall,
      color: theme.colors.mutedForeground,
      lineHeight: 20,
      marginBottom: 4,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    authorText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontSize: 12,
    },
    notificationMeta: {
      alignItems: 'flex-end',
    },
    timestamp: {
      ...theme.typography.bodySmall,
      color: theme.colors.mutedForeground,
      marginBottom: 4,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      ...theme.typography.h3,
      color: theme.colors.mutedForeground,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      textAlign: 'center',
    },
    preferencesSection: {
      marginTop: 16,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    preferenceDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
      marginHorizontal: 16,
    },
    preferencesTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    preferenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    preferenceContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    preferenceIcon: {
      marginRight: 12,
    },
    preferenceText: {
      flex: 1,
    },
    preferenceLabel: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '500',
      marginBottom: 2,
    },
    preferenceDescription: {
      ...theme.typography.bodySmall,
      color: theme.colors.mutedForeground,
    },
  });

  const renderListHeader = () => (
    <>
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="mail" size={16} color={theme.colors.info} />
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </>
  );

  const renderListFooter = () => (
    <>
      {renderPreferencesSection()}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isConnected ? theme.colors.success : theme.colors.error }
            ]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearNotifications}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

