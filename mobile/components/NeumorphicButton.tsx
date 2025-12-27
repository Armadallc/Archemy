import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import NeumorphicView from './NeumorphicView';
import { useTheme } from '../contexts/ThemeContext';

interface NeumorphicButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  borderRadius?: number;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export default function NeumorphicButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  borderRadius = 8,
  containerStyle,
  textStyle,
}: NeumorphicButtonProps) {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  // Detect dark theme: check if background is dark (charcoal color or similar)
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && (
      theme.colors.background === '#1e2023' || 
      theme.colors.background === '#26282b' ||
      theme.colors.background === theme.colors.charcoal
    ));

  // Button starts embossed, becomes debossed when pressed
  const buttonStyle = isPressed ? 'debossed' : 'embossed';

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.primaryForeground,
    },
    secondary: {
      backgroundColor: theme.colors.card,
      color: theme.colors.foreground,
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled || loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={containerStyle}
    >
      <NeumorphicView
        style={buttonStyle}
        intensity="medium"
        borderRadius={borderRadius}
        backgroundColor={currentVariant.backgroundColor}
        contentStyle={[
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={currentVariant.color}
          />
        ) : (
          <Text
            style={[
              {
                fontSize: currentSize.fontSize,
                fontWeight: '600',
                color: currentVariant.color,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}
      </NeumorphicView>
    </TouchableOpacity>
  );
}

