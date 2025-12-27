import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import NeumorphicView from './NeumorphicView';
import { useTheme } from '../contexts/ThemeContext';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: 'embossed' | 'debossed';
  intensity?: 'subtle' | 'medium' | 'strong';
  borderRadius?: number;
  padding?: number;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}

export default function NeumorphicCard({
  children,
  style,
  intensity = 'medium',
  borderRadius = 12,
  padding = 20,
  containerStyle,
  contentStyle,
}: NeumorphicCardProps) {
  const { theme } = useTheme();
  // Detect dark theme: check if background is dark (charcoal color or similar)
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && (
      theme.colors.background === '#1e2023' || 
      theme.colors.background === '#26282b' ||
      theme.colors.background === theme.colors.charcoal
    ));
  
  // Default: embossed for light theme, debossed for dark theme
  const defaultStyle = isDark ? 'debossed' : 'embossed';
  const cardStyle = style || defaultStyle;

  return (
    <NeumorphicView
      style={cardStyle}
      intensity={intensity}
      borderRadius={borderRadius}
      containerStyle={containerStyle}
      contentStyle={[
        {
          padding,
        },
        contentStyle,
      ]}
    >
      {children}
    </NeumorphicView>
  );
}

