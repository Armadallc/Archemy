import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { emergencyService } from '../../services/emergency';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationPreferences, NavigationApp } from '../../services/navigationPreferences';
import { useNotifications } from '../../contexts/NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { locationTrackingService } from '../../services/locationTracking';
import NeumorphicView from '../../components/NeumorphicView';

export default function MenuScreen() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, theme: themeState } = useTheme();
  const insets = useSafeAreaInsets();
  const [preferredNavApp, setPreferredNavApp] = useState<NavigationApp>('default');
  const [showNavAppPicker, setShowNavAppPicker] = useState(false);
  const { unreadCount } = useNotifications();
  const queryClient = useQueryClient();

  // Load navigation preference on mount
  useEffect(() => {
    const loadNavPreference = async () => {
      const app = await navigationPreferences.getPreferredApp();
      setPreferredNavApp(app);
    };
    loadNavPreference();
  }, []);

  const handleLogout = async () => {
    // For drivers, check for active trips before allowing logout
    if (user?.role === 'driver') {
      try {
        const trips = await apiClient.getDriverTrips();
        // Check for trips that are truly active (started but not ended)
        const activeTrips = trips?.filter((t: any) => {
          const isInProgressStatus = t.status === 'in_progress';
          const hasStarted = t.actual_pickup_time != null && t.actual_pickup_time !== '';
          const hasNotEnded = t.actual_dropoff_time == null || t.actual_dropoff_time === '';
          return isInProgressStatus && hasStarted && hasNotEnded;
        }) || [];
        
        if (activeTrips.length > 0) {
          // Build detailed message with trip information
          const tripCount = activeTrips.length;
          const tripList = activeTrips.map((trip: any, idx: number) => {
            const tripType = trip.trip_type === 'round_trip' ? 'Round Trip' : 'One Way';
            return `${idx + 1}. ${trip.client_name || 'Unknown Client'} (${tripType})\n   Pickup: ${trip.pickup_address || 'N/A'}\n   Dropoff: ${trip.dropoff_address || 'N/A'}`;
          }).join('\n\n');
          
          const message = `You cannot log out while you have ${tripCount} active trip${tripCount > 1 ? 's' : ''}.\n\n` +
            `Active trips:\n${tripList}\n\n` +
            `Please complete or cancel ${tripCount > 1 ? 'these trips' : 'this trip'} before logging out.`;
          
          if (Platform.OS === 'web') {
            const confirmed = typeof window !== 'undefined' && window.confirm(message + '\n\nDo you want to view your trips?');
            if (confirmed) {
              router.push('/(tabs)/dashboard');
            }
          } else {
            Alert.alert(
              'Cannot Log Out',
              message,
              [
                { text: 'View Trips', onPress: () => router.push('/(tabs)/dashboard') },
                { text: 'OK', style: 'cancel' }
              ]
            );
          }
          return; // Block logout
        }
      } catch (error) {
        console.error('❌ [Menu] Error checking for active trips before logout:', error);
        // Continue with logout if check fails - don't block user
      }
    }
    
    // Proceed with logout if no active trips or check failed
    if (Platform.OS === 'web') {
      // Use window.confirm for web as Alert.alert may not work properly
      const confirmed = typeof window !== 'undefined' && window.confirm('Are you sure you want to logout?');
      if (!confirmed) return;
      
      try {
        await logout();
        // Use full page reload on web to ensure all state is cleared
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, try to navigate
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
                router.replace('/(auth)/login');
              } catch (error) {
                console.error('Logout error:', error);
                // Even if logout fails, try to navigate
                router.replace('/(auth)/login');
              }
            },
          },
        ]
      );
    }
  };

  const handleEmergencyCall = () => {
    if (!user) return;

    Alert.alert(
      '🚨 EMERGENCY',
      'Are you sure you want to activate the emergency call? This will immediately alert emergency services and dispatch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CALL',
          style: 'destructive',
          onPress: () => {
            emergencyService.triggerPanicButton(
              user.id,
              user.name,
              undefined,
              undefined,
              undefined
            );
          },
        },
      ]
    );
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+17209753696');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:Seth@Rowandrive.com');
  };

  // Detect dark theme for neumorphic styling
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && theme.colors.background === '#1e2023');

  const getActualThemeMode = () => {
    if (themeState.mode === 'system') {
      return Platform.OS === 'web' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : (isDark ? 'dark' : 'light');
    }
    return themeState.mode;
  };

  const isDarkMode = getActualThemeMode() === 'dark';
  const actionColor = isDarkMode ? theme.colors.primary : theme.colors.error;
  const actionForeground = isDarkMode ? theme.colors.primaryForeground : '#fff';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 12,
      paddingHorizontal: 4,
      fontSize: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 8,
      // Remove border, use neumorphic shadows instead
    },
    menuItemIcon: {
      marginRight: 12,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '500',
      marginBottom: 2,
    },
    menuItemSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.mutedForeground,
    },
    menuItemChevron: {
      marginLeft: 8,
    },
    divider: {
      height: 1,
      backgroundColor: 'transparent', // Remove visible divider, use spacing instead
      marginVertical: 16,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      width: 56,
      height: 56,
      // Remove border, use neumorphic shadows instead
    },
    logoutThemeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    themeToggleContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeToggleText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '500',
      marginLeft: 12,
    },
    emergencyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      marginBottom: 32,
    },
    emergencyButtonText: {
      ...theme.typography.body,
      fontWeight: '600',
      marginLeft: 8,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      flex: 1,
      height: 56, // Match theme toggle height
      // Remove border, use neumorphic shadows instead
    },
    logoutButtonText: {
      ...theme.typography.body,
      fontWeight: '600',
      marginLeft: 8,
    },
    pickerModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      ...(Platform.OS === 'web' && {
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      } as any),
    },
    pickerContent: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      maxHeight: '80%',
    },
    pickerTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 20,
      paddingHorizontal: 24,
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    pickerOptionText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      marginLeft: 12,
      flex: 1,
    },
    pickerCheckmark: {
      marginLeft: 'auto',
    },
    unreadBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginRight: 8,
    },
    unreadBadgeText: {
      ...theme.typography.caption,
      color: theme.colors.primaryForeground,
      fontWeight: '700',
      fontSize: 11,
    },
    header: {
      backgroundColor: theme.colors.card,
      padding: 16,
      paddingBottom: 16,
      zIndex: 10,
      // Remove border, use neumorphic shadows instead
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <NeumorphicView
        style={isDark ? 'debossed' : 'embossed'}
        intensity="medium"
        borderRadius={0}
        containerStyle={StyleSheet.flatten([styles.header, { paddingTop: insets.top + 16 }])}
        contentStyle={{ overflow: 'visible' }}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Menu</Text>
        </View>
      </NeumorphicView>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.menuItem}
          >
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
            >
              <Ionicons
                name="person"
                size={24}
                color={theme.colors.primary}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>View Profile</Text>
                <Text style={styles.menuItemSubtitle}>
                  {user?.name || 'Driver'} • {user?.email}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.mutedForeground}
                style={styles.menuItemChevron}
              />
            </TouchableOpacity>
          </NeumorphicView>
          
          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.menuItem}
          >
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
            >
              <Ionicons
                name="notifications"
                size={24}
                color={theme.colors.primary}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>View Notifications</Text>
                <Text style={styles.menuItemSubtitle}>
                  {unreadCount > 0 
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'No new notifications'}
                </Text>
              </View>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount.toString()}
                  </Text>
                </View>
              )}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.mutedForeground}
                style={styles.menuItemChevron}
              />
            </TouchableOpacity>
          </NeumorphicView>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.menuItem}
          >
            <TouchableOpacity
              onPress={() => setShowNavAppPicker(true)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
            >
              <Ionicons
                name="navigate"
                size={24}
                color={theme.colors.primary}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Navigation App</Text>
                <Text style={styles.menuItemSubtitle}>
                  {navigationPreferences.getAvailableApps().find(a => a.value === preferredNavApp)?.label || 'Default'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.mutedForeground}
                style={styles.menuItemChevron}
              />
            </TouchableOpacity>
          </NeumorphicView>

          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.menuItem}
          >
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/privacy-security')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
            >
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={theme.colors.primary}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Privacy & Security</Text>
                <Text style={styles.menuItemSubtitle}>Manage your privacy settings</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.mutedForeground}
                style={styles.menuItemChevron}
              />
            </TouchableOpacity>
          </NeumorphicView>

          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.menuItem}
          >
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/help-faq')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
            >
              <Ionicons
                name="help-circle"
                size={24}
                color={theme.colors.primary}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Help & FAQ</Text>
                <Text style={styles.menuItemSubtitle}>Get help and answers to questions</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.mutedForeground}
                style={styles.menuItemChevron}
              />
            </TouchableOpacity>
          </NeumorphicView>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.menuItem}
          >
            <TouchableOpacity
              onPress={handleCallSupport}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
            >
              <Ionicons
                name="call"
                size={24}
                color={theme.colors.primary}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Call Support</Text>
                <Text style={styles.menuItemSubtitle}>Contact support by phone</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.mutedForeground}
                style={styles.menuItemChevron}
              />
            </TouchableOpacity>
          </NeumorphicView>

          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.menuItem}
          >
            <TouchableOpacity
              onPress={handleEmailSupport}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
            >
              <Ionicons
                name="mail"
                size={24}
                color={theme.colors.primary}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Email Support</Text>
                <Text style={styles.menuItemSubtitle}>Send an email to support</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.mutedForeground}
                style={styles.menuItemChevron}
              />
            </TouchableOpacity>
          </NeumorphicView>
        </View>

        <View style={styles.divider} />

        {/* Logout and Theme Toggle Row */}
        <View style={styles.logoutThemeRow}>
          {/* Logout */}
          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.logoutButton}
          >
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}
            >
              <Ionicons name="log-out-outline" size={20} color={actionColor} />
              <Text style={[styles.logoutButtonText, { color: actionColor }]}>Logout</Text>
            </TouchableOpacity>
          </NeumorphicView>

          {/* Theme Toggle - Icon Only */}
          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="subtle"
            borderRadius={12}
            containerStyle={styles.themeToggle}
          >
            <TouchableOpacity
              onPress={toggleTheme}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
            >
              <Ionicons
                name={getActualThemeMode() === 'dark' ? 'moon' : 'sunny'}
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </NeumorphicView>
        </View>

        {/* Emergency Call Button */}
        <NeumorphicView
          style={isDark ? 'embossed' : 'debossed'}
          intensity="medium"
          borderRadius={12}
          containerStyle={styles.emergencyButton}
          backgroundColor={actionColor}
        >
          <TouchableOpacity
            onPress={handleEmergencyCall}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}
          >
            <Ionicons name="warning" size={24} color={actionForeground} />
            <Text style={[styles.emergencyButtonText, { color: actionForeground }]}>EMERGENCY CALL</Text>
          </TouchableOpacity>
        </NeumorphicView>
      </ScrollView>

      {/* Navigation App Picker Modal */}
      <Modal
        visible={showNavAppPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNavAppPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModal}
          activeOpacity={1}
          onPress={() => setShowNavAppPicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerContent}
            activeOpacity={1}
            onPress={(e) => {
              if (Platform.OS === 'web') {
                e?.stopPropagation?.();
              }
            }}
          >
            <Text style={styles.pickerTitle}>Select Navigation App</Text>
            {navigationPreferences.getAvailableApps().map((app) => (
              <TouchableOpacity
                key={app.value}
                style={styles.pickerOption}
                onPress={async () => {
                  await navigationPreferences.setPreferredApp(app.value);
                  setPreferredNavApp(app.value);
                  setShowNavAppPicker(false);
                  Alert.alert('Success', `Navigation app set to ${app.label}`);
                }}
              >
                <Ionicons name={app.icon as any} size={24} color={theme.colors.primary} />
                <Text style={styles.pickerOptionText}>{app.label}</Text>
                {preferredNavApp === app.value && (
                  <Ionicons 
                    name="checkmark" 
                    size={20} 
                    color={theme.colors.primary} 
                    style={styles.pickerCheckmark}
                  />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

