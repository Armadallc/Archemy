import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationItem {
  id: string;
  type: 'trip_update' | 'new_trip' | 'emergency' | 'system' | 'reminder';
  title: string;
  body: string;
  timestamp: string;
  read?: boolean;
  data?: any;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { 
    notifications, 
    clearNotifications, 
    markAsRead, 
    unreadCount,
    isConnected,
    connectionState 
  } = useNotifications();

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
      case 'reminder':
        return 'time';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'trip_update':
        return '#3B82F6';
      case 'new_trip':
        return '#10B981';
      case 'emergency':
        return '#EF4444';
      case 'system':
        return '#6B7280';
      case 'reminder':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
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
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.body}</Text>
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
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No notifications</Text>
      <Text style={styles.emptySubtext}>
        {isConnected ? 'You\'ll see notifications here when they arrive' : 'Connect to receive notifications'}
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      paddingTop: insets.top,
    },
    header: {
      backgroundColor: 'white',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
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
      fontSize: 12,
      color: '#666',
      fontWeight: '500',
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#f0f0f0',
      borderRadius: 6,
    },
    clearButtonText: {
      fontSize: 12,
      color: '#666',
      fontWeight: '600',
    },
    unreadBanner: {
      backgroundColor: '#EBF8FF',
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#E0F2FE',
    },
    unreadText: {
      fontSize: 14,
      color: '#3B82F6',
      fontWeight: '600',
      marginLeft: 8,
    },
    listContainer: {
      flexGrow: 1,
    },
    notificationItem: {
      backgroundColor: 'white',
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    unreadNotification: {
      borderLeftWidth: 4,
      borderLeftColor: '#3B82F6',
    },
    notificationContent: {
      padding: 16,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#f8f9fa',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationText: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 4,
    },
    notificationBody: {
      fontSize: 14,
      color: '#666',
      lineHeight: 20,
    },
    notificationMeta: {
      alignItems: 'flex-end',
    },
    timestamp: {
      fontSize: 12,
      color: '#999',
      marginBottom: 4,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#3B82F6',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#999',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
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

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="mail" size={16} color="#3B82F6" />
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

