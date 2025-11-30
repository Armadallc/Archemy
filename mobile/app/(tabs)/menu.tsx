import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { emergencyService } from '../../services/emergency';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, theme: themeState } = useTheme();
  const insets = useSafeAreaInsets();

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

  const getActualThemeMode = () => {
    if (themeState.mode === 'system') {
      return Platform.OS === 'web' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : (themeState.mode === 'dark' ? 'dark' : 'light');
    }
    return themeState.mode;
  };

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
      backgroundColor: theme.colors.destructive,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      marginBottom: 32,
    },
    emergencyButtonText: {
      ...theme.typography.body,
      color: theme.colors.destructiveForeground,
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
      borderColor: theme.colors.destructive,
    },
    logoutButtonText: {
      ...theme.typography.body,
      color: theme.colors.destructive,
      fontWeight: '600',
      marginLeft: 8,
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
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
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
              <Text style={styles.menuItemTitle}>Notifications</Text>
              <Text style={styles.menuItemSubtitle}>Manage notification preferences</Text>
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
                'Help & Support',
                'For assistance, please contact support:\n\nPhone: (555) 123-4567\nEmail: support@monarch.com',
                [
                  { text: 'Call Support', onPress: handleCallSupport },
                  { text: 'OK', style: 'default' },
                ]
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
              <Text style={styles.menuItemTitle}>Help & Support</Text>
              <Text style={styles.menuItemSubtitle}>Get help and contact support</Text>
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
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.destructive} />
          <Text style={styles.logoutButtonText}>Logout</Text>
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
          style={styles.emergencyButton}
          onPress={handleEmergencyCall}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={24} color={theme.colors.destructiveForeground} />
          <Text style={styles.emergencyButtonText}>EMERGENCY CALL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

