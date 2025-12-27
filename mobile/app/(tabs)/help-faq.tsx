import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpFAQScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const faqItems: FAQItem[] = [
    {
      question: 'How does the mobile app work?',
      answer: 'The mobile app allows drivers to view their assigned trips, update trip statuses, share their location with fleet managers, and communicate with dispatch. Your location is only shared when you toggle "Available" ON in the menu. You can view trips, start trips, complete trips, and manage your profile all from the app.',
    },
    {
      question: 'What is the "Available" toggle and when should I use it?',
      answer: 'The "Available" toggle controls whether your location is shared with fleet managers. When ON, your location is visible to admins. When OFF, your location is private. You must have availability ON before starting a trip. Once a trip is in progress, you cannot turn availability OFF until the trip is completed or cancelled.',
    },
    {
      question: 'Why can\'t I turn off the "Available" toggle?',
      answer: 'If you have an active trip (a trip that has started but not been completed), you cannot turn off availability. This ensures your location is always tracked during active trips. To turn off availability, first complete or cancel any active trips in the Trips section.',
    },
    {
      question: 'Why can\'t I start a trip?',
      answer: 'You must have the "Available" toggle turned ON before you can start a trip. If you try to start a trip with availability OFF, you\'ll be prompted to enable location sharing first. This ensures your location is tracked during the trip.',
    },
    {
      question: 'What should I do if I see an error message?',
      answer: 'Most errors will show a clear message explaining what went wrong. Common issues:\n\n• "Cannot disable location sharing" - You have an active trip that needs to be completed first\n• "Failed to update availability" - Check your internet connection and try again\n• "Driver profile not loaded" - Refresh the app or log out and log back in\n\nIf errors persist, contact support using the number at the bottom of this page.',
    },
    {
      question: 'How do I update my trip status?',
      answer: 'Navigate to the Trips tab, select a trip, and use the status buttons to update it. You can mark trips as "In Progress" when you start, "Completed" when finished, or "Cancelled" if needed. The app will automatically track your location during active trips.',
    },
    {
      question: 'What if I forget to complete a trip?',
      answer: 'If you try to log out or turn off availability with an incomplete trip, the app will alert you and show which trips need to be completed. You must complete or cancel all active trips before logging out. This helps ensure accurate trip records.',
    },
    {
      question: 'How does location tracking work?',
      answer: 'When you toggle "Available" ON, the app continuously tracks your location and shares it with fleet managers. During active trips, location sharing is mandatory and cannot be turned off. Your location is only shared when you\'re available or on an active trip - it remains private otherwise.',
    },
    {
      question: 'What if the app is slow or not responding?',
      answer: 'If the app feels slow, try:\n\n• Refreshing by pulling down on the screen\n• Closing and reopening the app\n• Checking your internet connection\n• Restarting your device if issues persist\n\nThe availability toggle should respond instantly - if it doesn\'t, check your connection.',
    },
    {
      question: 'Can I use the app without sharing my location?',
      answer: 'Yes, you can view trips and use most features with availability OFF. However, you must turn availability ON before starting a trip, as location tracking is required during active trips for safety and trip management.',
    },
  ];

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleCall = () => {
    Linking.openURL('tel:+17209753696');
  };

  const handleText = () => {
    Linking.openURL('sms:+17209753696');
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
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 24,
      marginBottom: 16,
    },
    faqItem: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    faqQuestion: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    faqQuestionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginRight: 12,
    },
    faqAnswer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 0,
    },
    faqAnswerText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    contactSection: {
      marginTop: 32,
      marginBottom: 32,
      padding: 20,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    contactTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    contactText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 22,
    },
    contactNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 16,
    },
    contactButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    contactButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    contactButtonText: {
      color: theme.colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    contactButtonSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.muted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    contactButtonSecondaryText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
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
            style={{ marginBottom: 16, alignSelf: 'flex-start' }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Help & FAQ</Text>
          <Text style={styles.subtitle}>
            Find answers to common questions and learn how to use the mobile app effectively.
          </Text>
        </View>

        {/* Getting Started Section */}
        <Text style={styles.sectionTitle}>Getting Started</Text>
        {faqItems.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleItem(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqQuestionText}>{item.question}</Text>
              <Ionicons
                name={expandedItems.has(index) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            {expandedItems.has(index) && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Common Issues Section */}
        <Text style={styles.sectionTitle}>Common Issues & Solutions</Text>
        {faqItems.slice(3, 7).map((item, index) => (
          <View key={index + 3} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleItem(index + 3)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqQuestionText}>{item.question}</Text>
              <Ionicons
                name={expandedItems.has(index + 3) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            {expandedItems.has(index + 3) && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Tips & Best Practices Section */}
        <Text style={styles.sectionTitle}>Tips & Best Practices</Text>
        {faqItems.slice(7).map((item, index) => (
          <View key={index + 7} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleItem(index + 7)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqQuestionText}>{item.question}</Text>
              <Ionicons
                name={expandedItems.has(index + 7) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            {expandedItems.has(index + 7) && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Contact Support Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need More Help?</Text>
          <Text style={styles.contactText}>
            If you're experiencing issues not covered here or need additional assistance, contact Sef directly:
          </Text>
          <Text style={styles.contactNumber}>720-975-3696</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={20} color={theme.colors.primaryForeground} />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButtonSecondary}
              onPress={handleText}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={20} color={theme.colors.text} />
              <Text style={styles.contactButtonSecondaryText}>Text</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

