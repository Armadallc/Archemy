import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trackColor?: { false: string; true: string };
  thumbColor?: { false: string; true: string };
}

export default function CustomToggle({
  value,
  onValueChange,
  disabled = false,
  trackColor = { false: 'rgba(255, 255, 255, 1)', true: 'rgba(255, 255, 255, 1)' },
  thumbColor = { false: 'rgba(255, 132, 117, 0.4)', true: '#ff8475' },
}: CustomToggleProps) {
  const translateX = React.useRef(new Animated.Value(value ? 20 : 0)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 20 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [value, translateX]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.container,
        {
          backgroundColor: trackColor[value ? 'true' : 'false'],
          borderColor: '#ff8475',
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        collapsable={true}
        style={[
          styles.thumb,
          {
            backgroundColor: thumbColor[value ? 'true' : 'false'],
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff8475',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

