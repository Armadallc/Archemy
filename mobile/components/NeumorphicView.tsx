import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { getNeumorphicShadow, type NeumorphicStyle } from '../constants/design-tokens/colors';
import { useTheme } from '../contexts/ThemeContext';

interface NeumorphicViewProps {
  children: React.ReactNode;
  style?: NeumorphicStyle;
  intensity?: 'subtle' | 'medium' | 'strong';
  borderRadius?: number;
  backgroundColor?: string;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}

export default function NeumorphicView({
  children,
  style = 'embossed',
  intensity = 'medium',
  borderRadius = 12,
  backgroundColor,
  containerStyle,
  contentStyle,
}: NeumorphicViewProps) {
  const { theme } = useTheme();
  // Detect dark theme: check if background is dark (charcoal color or similar)
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && (
      theme.colors.background === '#1e2023' || 
      theme.colors.background === '#26282b' ||
      theme.colors.background === theme.colors.charcoal
    ));
  
  // Adjust shadow intensity
  const intensityMultiplier = {
    subtle: 0.5,
    medium: 1,
    strong: 1.5,
  }[intensity];

  const shadowConfig = getNeumorphicShadow(isDark, style);
  const bgColor = backgroundColor || theme.colors.card || theme.colors.background;

  if (Platform.OS === 'web') {
    // Web: Use CSS box-shadow with multiple shadows
    const lightShadow = shadowConfig.light;
    const darkShadow = shadowConfig.dark;
    
    const lightColor = lightShadow.shadowColor;
    const darkColor = darkShadow.shadowColor;
    const offset = Math.abs(lightShadow.shadowOffset.width) * intensityMultiplier;
    const blur = lightShadow.shadowRadius * intensityMultiplier;
    const lightOpacity = lightShadow.shadowOpacity;
    const darkOpacity = darkShadow.shadowOpacity;

    // Convert hex to rgba for web
    const hexToRgba = (hex: string, opacity: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // For web, we need to use a style tag or inline styles with CSS
    // React Native Web doesn't support boxShadow in ViewStyle directly
    const webStyle: any = {
      backgroundColor: bgColor,
      borderRadius,
      // Use CSS box-shadow property (works on web)
      boxShadow: `${-offset}px ${-offset}px ${blur}px ${hexToRgba(lightColor, lightOpacity)}, ${offset}px ${offset}px ${blur}px ${hexToRgba(darkColor, darkOpacity)}`,
    };

    return (
      <View style={[webStyle, containerStyle, contentStyle]}>
        {children}
      </View>
    );
  }

  // Native: Use a combination of shadows, borders, and elevation
  // React Native doesn't support multiple shadows, so we simulate with borders and single shadow
  const offset = 5 * intensityMultiplier;
  const isEmbossed = style === 'embossed';
  
  // Calculate border colors for neumorphic effect
  const getBorderColor = () => {
    if (isDark) {
      return isEmbossed 
        ? 'rgba(70, 74, 79, 0.4)' // Lighter border for embossed in dark mode
        : 'rgba(26, 28, 30, 0.6)'; // Darker border for debossed in dark mode
    } else {
      return isEmbossed
        ? 'rgba(250, 251, 255, 0.6)' // Light border for embossed in light mode
        : 'rgba(22, 27, 29, 0.2)'; // Dark border for debossed in light mode
    }
  };

  // For native, create neumorphic effect using borders, elevation, and shadows
  const nativeStyle: ViewStyle = {
    backgroundColor: bgColor,
    borderRadius,
    // Use elevation for Android (positive for embossed, negative not supported, so use 0)
    elevation: Platform.OS === 'android' ? (isEmbossed ? 6 * intensityMultiplier : 2) : 0,
    // iOS shadows - use dual shadows for better neumorphic effect
    ...(Platform.OS === 'ios' && {
      shadowColor: isDark ? '#1a1c1e' : '#161B1D',
      shadowOffset: {
        width: isEmbossed ? offset : -offset,
        height: isEmbossed ? offset : -offset,
      },
      shadowOpacity: isEmbossed ? 0.5 : 0.6,
      shadowRadius: 10 * intensityMultiplier,
    }),
    // Add borders to enhance the neumorphic effect
    borderWidth: 1.5,
    borderColor: getBorderColor(),
    // Ensure shadows render properly on iOS
    overflow: 'visible',
  };

  return (
    <View
      style={[
        nativeStyle,
        containerStyle,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );
}

// Styles removed - using inline styles for native platform

