import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { emergencyService } from '../../services/emergency';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationPreferences, NavigationApp } from '../../services/navigationPreferences';
import { useNotifications } from '../../contexts/NotificationContext';

export default function MenuScreen() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, theme: themeState } = useTheme();
  const insets = useSafeAreaInsets();
  const [preferredNavApp, setPreferredNavApp] = useState<NavigationApp>('default');
  const [showNavAppPicker, setShowNavAppPicker] = useState(false);
  const { unreadCount } = useNotifications();

  // Load navigation preference on mount
  useEffect(() => {
    const loadNavPreference = async () => {
      const app = await navigationPreferences.getPreferredApp();
      setPreferredNavApp(app);
    };
    loadNavPreference();
  }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
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
              Alert.alert('Error', 'Logout failed. Please try again.');
            }
          },
        },
      ]);
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
                Alert.alert('Error', 'Logout failed. Please try again.');
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
    Linking.openURL('tel:+1234567890');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@monarch.com');
  };

  const getActualThemeMode = () => {
    if (themeState.mode === 'system') {
      return Platform.OS === 'web' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : (themeState.mode === 'dark' ? 'dark' : 'light');
    }
    return themeState.mode;
  };

  const isDarkMode = getActualThemeMode() === 'dark';
  const actionColor = isDarkMode ? theme.colors.primary : theme.colors.destructive;
  const actionForeground = isDarkMode ? theme.colors.primaryForeground : theme.colors.destructiveForeground;

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
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      backgroundColor: theme.colors.border,
      marginVertical: 16,
    },
    themeToggle: {
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
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
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
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
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
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.7}
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
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowNavAppPicker(true)}
            activeOpacity={0.7}
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('Privacy & Security', 'Privacy and security settings coming soon.');
            }}
            activeOpacity={0.7}
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert(
                'Help & FAQ',
                'Frequently asked questions and help resources coming soon.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
            activeOpacity={0.7}
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
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleCallSupport}
            activeOpacity={0.7}
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEmailSupport}
            activeOpacity={0.7}
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
        </View>

        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: actionColor }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={actionColor} />
          <Text style={[styles.logoutButtonText, { color: actionColor }]}>Logout</Text>
        </TouchableOpacity>

        {/* Theme Toggle */}
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <View style={styles.themeToggleContent}>
            <Ionicons
              name={getActualThemeMode() === 'dark' ? 'moon' : 'sunny'}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.themeToggleText}>
              {getActualThemeMode() === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.mutedForeground}
          />
        </TouchableOpacity>

        {/* Emergency Call Button */}
        <TouchableOpacity
          style={[styles.emergencyButton, { backgroundColor: actionColor }]}
          onPress={handleEmergencyCall}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={24} color={actionForeground} />
          <Text style={[styles.emergencyButtonText, { color: actionForeground }]}>EMERGENCY CALL</Text>
        </TouchableOpacity>
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

