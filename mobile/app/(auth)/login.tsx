import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { router, useNavigation } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation();

  // Configure header with charcoal background
  useLayoutEffect(() => {
    const charcoalColor = 'rgba(52, 52, 52, 1)'; // Charcoal color
    const cloudColor = '#f4f4f4'; // Cloud color from palette
    navigation.setOptions({
      headerShown: true,
      title: '', // Remove "(auth)/login" text
      headerStyle: {
        backgroundColor: charcoalColor,
        borderBottomColor: charcoalColor,
        borderBottomWidth: 1,
      },
      headerTintColor: cloudColor, // Cloud text for contrast on charcoal
      headerTitleStyle: {
        color: cloudColor,
      },
    });
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 [Login] Attempting login for:', email);
      await login(email.trim().toLowerCase(), password);
      console.log('✅ [Login] Login successful, redirecting...');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('❌ [Login] Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Login Failed', 
        errorMessage.includes('Invalid credentials') || errorMessage.includes('401')
          ? 'Invalid email or password. Please check your credentials and try again.'
          : `Login failed: ${errorMessage}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      ...(Platform.OS === 'web' && { height: 714 }),
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.foreground,
      marginBottom: 8,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
    },
    form: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.foreground,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...theme.typography.body,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.foreground,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.mutedForeground,
      opacity: 0.5,
    },
    buttonText: {
      ...theme.typography.body,
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>HALCYON DRIVE</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.mutedForeground}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
