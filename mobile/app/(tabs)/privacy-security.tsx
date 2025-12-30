import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export default function PrivacySecurityScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>('unknown');
  const [backgroundLocationPermissionStatus, setBackgroundLocationPermissionStatus] = useState<string>('unknown');
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<string>('unknown');
  
  // Fetch driver profile to get availability status
  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => apiClient.getDriverProfile(),
    enabled: user?.role === 'driver',
  });

  const isAvailable = driverProfile?.is_available ?? false;

  // Check permission statuses on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // Check location permissions
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
    } catch (error) {
      console.error('Error checking location permission:', error);
    }

    // Check background location permissions (iOS)
    if (Platform.OS === 'ios') {
      try {
        const { status } = await Location.getBackgroundPermissionsAsync();
        setBackgroundLocationPermissionStatus(status);
      } catch (error) {
        console.error('Error checking background location permission:', error);
      }
    }

    // Check notification permissions
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermissionStatus(status);
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const openDeviceSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const getPermissionStatusText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'undetermined':
        return 'Not Set';
      default:
        return 'Unknown';
    }
  };

  const getPermissionStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
        return '#10B981'; // Green
      case 'denied':
        return '#EF4444'; // Red
      case 'undetermined':
        return '#F59E0B'; // Yellow
      default:
        return theme.colors.textSecondary;
    }
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download My Data',
      'This feature will allow you to download all your personal data stored in the app. Coming soon.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone. Coming soon.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Not Available', 'Account deletion is not yet available. Please contact support for assistance.');
        }}
      ]
    );
  };

  const handleClearAppData = () => {
    Alert.alert(
      'Clear App Data',
      'This will clear all locally stored app data, including preferences and cached information. You will need to log in again. Coming soon.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          Alert.alert('Not Available', 'This feature is not yet available.');
        }}
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change functionality is coming soon. For now, please contact support if you need to reset your password.',
      [{ text: 'OK' }]
    );
  };

  const handleTwoFactorAuth = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Two-factor authentication adds an extra layer of security to your account. Coming soon.',
      [{ text: 'OK' }]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 24,
    },
    backButton: {
      marginBottom: 16,
      alignSelf: 'flex-start',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    settingCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    settingContent: {
      flex: 1,
      marginRight: 12,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    settingValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    permissionStatus: {
      fontSize: 14,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    linkText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.muted,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginLeft: 8,
    },
    dangerButton: {
      backgroundColor: theme.colors.destructive || '#EF4444',
      borderColor: theme.colors.destructive || '#EF4444',
    },
    dangerButtonText: {
      color: '#FFFFFF',
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 16,
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/menu')}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy & Security</Text>
          <Text style={styles.subtitle}>
            Manage your privacy settings, permissions, and account security.
          </Text>
        </View>

        {/* Location Sharing Section (Functional) */}
        {user?.role === 'driver' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Sharing</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Location Availability</Text>
                  <Text style={styles.settingDescription}>
                    Control when your location is shared with fleet managers. Location sharing is required during active trips.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/menu')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={theme.colors.mutedForeground} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Current Status</Text>
                  <Text style={styles.settingDescription}>
                    {isAvailable 
                      ? 'Your location is currently being shared with fleet managers.'
                      : 'Your location is private and not being shared.'}
                  </Text>
                </View>
                <View style={[styles.permissionStatus, { 
                  backgroundColor: isAvailable ? '#10B98120' : '#6B728020',
                  color: isAvailable ? '#10B981' : theme.colors.textSecondary
                }]}>
                  <Text style={{ color: isAvailable ? '#10B981' : theme.colors.textSecondary }}>
                    {isAvailable ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How Location Sharing Works</Text>
              <Text style={styles.infoText}>
                • Your location is only shared when "Available" is turned ON{'\n'}
                • Location sharing is automatically enabled when you start a trip{'\n'}
                • You cannot disable location sharing during active trips{'\n'}
                • Your location data is encrypted and stored securely{'\n'}
                • Location data is only accessible to authorized fleet managers
              </Text>
            </View>
          </View>
        )}

        {/* App Permissions Section (Functional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Permissions</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Location Permission</Text>
                <Text style={styles.settingDescription}>
                  Required for trip tracking and navigation
                </Text>
              </View>
              <View style={[styles.permissionStatus, { 
                backgroundColor: `${getPermissionStatusColor(locationPermissionStatus)}20`,
              }]}>
                <Text style={{ color: getPermissionStatusColor(locationPermissionStatus) }}>
                  {getPermissionStatusText(locationPermissionStatus)}
                </Text>
              </View>
            </View>
            {Platform.OS === 'ios' && (
              <>
                <View style={styles.divider} />
                <View style={styles.settingItem}>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Background Location</Text>
                    <Text style={styles.settingDescription}>
                      Allows location tracking when app is in background
                    </Text>
                  </View>
                  <View style={[styles.permissionStatus, { 
                    backgroundColor: `${getPermissionStatusColor(backgroundLocationPermissionStatus)}20`,
                  }]}>
                    <Text style={{ color: getPermissionStatusColor(backgroundLocationPermissionStatus) }}>
                      {getPermissionStatusText(backgroundLocationPermissionStatus)}
                    </Text>
                  </View>
                </View>
              </>
            )}
            <View style={styles.divider} />
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Required for trip updates and alerts
                </Text>
              </View>
              <View style={[styles.permissionStatus, { 
                backgroundColor: `${getPermissionStatusColor(notificationPermissionStatus)}20`,
              }]}>
                <Text style={{ color: getPermissionStatusColor(notificationPermissionStatus) }}>
                  {getPermissionStatusText(notificationPermissionStatus)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={openDeviceSettings}
            activeOpacity={0.7}
          >
            <Ionicons name="settings" size={20} color={theme.colors.text} />
            <Text style={styles.actionButtonText}>Open Device Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Preferences (Functional - Link) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Manage Notifications</Text>
                <Text style={styles.settingDescription}>
                  Control which types of notifications you receive
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.mutedForeground} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleChangePassword}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingDescription}>
                  Update your account password
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.mutedForeground} 
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleTwoFactorAuth}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>
                  Add an extra layer of security to your account
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.mutedForeground} 
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Active Sessions</Text>
                <Text style={styles.settingDescription}>
                  View and manage devices where you're logged in
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                Coming Soon
              </Text>
            </View>
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What Data We Collect</Text>
            <Text style={styles.infoText}>
              • Location data (when availability is ON or during trips){'\n'}
              • Trip information and status updates{'\n'}
              • Profile information (name, email, phone){'\n'}
              • Device information for app functionality{'\n'}
              • Usage data to improve the app experience
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How We Use Your Data</Text>
            <Text style={styles.infoText}>
              • Trip coordination and fleet management{'\n'}
              • Real-time location tracking (when enabled){'\n'}
              • Communication and notifications{'\n'}
              • App functionality and improvements{'\n'}
              • Safety and emergency response
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Data Security</Text>
            <Text style={styles.infoText}>
              • All data is encrypted in transit and at rest{'\n'}
              • Location data is only accessible to authorized personnel{'\n'}
              • Your data is stored securely and backed up regularly{'\n'}
              • We comply with data protection regulations
            </Text>
          </View>
        </View>

        {/* Data Management Section (Placeholders) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleDownloadData}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Download My Data</Text>
                <Text style={styles.settingDescription}>
                  Request a copy of all your personal data
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.mutedForeground} 
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleClearAppData}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Clear App Data</Text>
                <Text style={styles.settingDescription}>
                  Clear all locally stored app data and cache
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.mutedForeground} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Deletion Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Questions About Privacy?</Text>
            <Text style={styles.infoText}>
              If you have questions about how we handle your data or need help with privacy settings, contact support.
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/(tabs)/help-faq')}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle" size={16} color={theme.colors.primary} />
              <Text style={styles.linkText}>Visit Help & FAQ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}




