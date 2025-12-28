import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Platform, View, StyleSheet } from 'react-native';

// Custom icon component with glow effect for active tabs
const TabBarIconWithGlow = ({ name, color, size, focused }: { name: string; color: string; size: number; focused: boolean }) => {
  const glowColor = '#ff8475'; // Coral glow from Fire palette
  
  return (
    <View style={styles.iconContainer}>
      <Ionicons 
        name={name as any} 
        size={size} 
        color={color}
        style={[
          focused && Platform.OS === 'web' && {
            filter: `drop-shadow(0 0 4px ${glowColor}80) drop-shadow(0 0 8px ${glowColor}40)`,
          } as any,
          focused && Platform.OS !== 'web' && {
            textShadowColor: glowColor,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 6,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function TabLayout() {
  const { theme } = useTheme();
  
  // Detect dark theme for neumorphic styling
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && theme.colors.background === '#1e2023');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff8475',
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 16,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 0, // Remove border for neumorphic design
          // Enhanced neumorphic shadow effects
          ...(Platform.OS === 'ios' && {
            shadowColor: isDark ? '#1a1c1e' : '#161B1D',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 12,
          }),
          ...(Platform.OS === 'android' && {
            elevation: isDark ? 12 : 6,
          }),
          ...(Platform.OS === 'web' && {
            boxShadow: isDark 
              ? '0 -6px 12px rgba(26, 28, 30, 0.5), 0 6px 12px rgba(70, 74, 79, 0.3)' 
              : '0 -4px 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
          } as any),
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIconWithGlow name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIconWithGlow name="chatbubbles" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIconWithGlow name="menu" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="trip-details"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar - accessible via menu
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tab bar - accessible via menu
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          href: null, // Hide from tab bar - accessible via menu
        }}
      />
      <Tabs.Screen
        name="debug"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="help-faq"
        options={{
          href: null, // Hide from tab bar - accessible via menu
        }}
      />
      <Tabs.Screen
        name="privacy-security"
        options={{
          href: null, // Hide from tab bar - accessible via menu
        }}
      />
    </Tabs>
  );
}

