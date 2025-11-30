import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { emergencyService, EmergencyData } from '../../services/emergency';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmergencyScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState<EmergencyData['type']>('other');
  const [incidentSeverity, setIncidentSeverity] = useState<EmergencyData['severity']>('medium');
  const [incidentDescription, setIncidentDescription] = useState('');

  useEffect(() => {
    // Initialize emergency service
    emergencyService.initialize();
  }, []);

  const handlePanicButton = () => {
    if (!user) return;

    Alert.alert(
      '🚨 PANIC BUTTON',
      'Are you sure you want to activate the panic button? This will immediately alert emergency services and dispatch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACTIVATE',
          style: 'destructive',
          onPress: () => {
            emergencyService.triggerPanicButton(
              user.id,
              user.name,
              undefined, // tripId - would be passed from current trip context
              undefined, // clientId
              undefined  // clientName
            );
            setIsEmergencyActive(true);
          },
        },
      ]
    );
  };

  const handleCancelEmergency = () => {
    Alert.alert(
      'Cancel Emergency',
      'Are you sure you want to cancel the emergency?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            await emergencyService.cancelEmergency();
            setIsEmergencyActive(false);
          },
        },
      ]
    );
  };

  const handleReportIncident = () => {
    if (!incidentDescription.trim()) {
      Alert.alert('Error', 'Please provide a description of the incident');
      return;
    }

    if (!user) return;

    emergencyService.reportIncident(
      user.id,
      user.name,
      incidentType,
      incidentSeverity,
      incidentDescription.trim()
    );

    setShowIncidentModal(false);
    setIncidentDescription('');
  };

  const getSeverityColor = (severity: EmergencyData['severity']) => {
    switch (severity) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: EmergencyData['type']) => {
    switch (type) {
      case 'panic': return 'warning';
      case 'medical': return 'medical';
      case 'safety': return 'shield-checkmark';
      case 'vehicle': return 'car';
      case 'other': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      paddingTop: insets.top,
    },
    header: {
      backgroundColor: 'white',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: '#6B7280',
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 16,
    },
    panicButton: {
      backgroundColor: '#EF4444',
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    panicButtonText: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 12,
    },
    panicButtonSubtext: {
      color: 'white',
      fontSize: 14,
      marginTop: 4,
      opacity: 0.9,
    },
    activeEmergencyContainer: {
      backgroundColor: '#FEF2F2',
      borderRadius: 16,
      padding: 24,
      borderWidth: 2,
      borderColor: '#EF4444',
    },
    activeEmergencyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    activeEmergencyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#EF4444',
      marginLeft: 12,
    },
    activeEmergencyText: {
      fontSize: 16,
      color: '#991B1B',
      marginBottom: 16,
      lineHeight: 24,
    },
    cancelEmergencyButton: {
      backgroundColor: '#EF4444',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    cancelEmergencyText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    actionButton: {
      backgroundColor: 'white',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    actionButtonText: {
      flex: 1,
      fontSize: 16,
      color: '#333',
      marginLeft: 12,
    },
    infoCard: {
      backgroundColor: 'white',
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: '#666',
      marginLeft: 12,
      lineHeight: 20,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'white',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    closeButton: {
      padding: 8,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 12,
    },
    typeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f8f9fa',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    typeButtonActive: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    typeButtonText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 6,
    },
    typeButtonTextActive: {
      color: 'white',
    },
    severityButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    severityButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f8f9fa',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    severityButtonActive: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    severityButtonText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 6,
    },
    severityButtonTextActive: {
      color: 'white',
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: '#3B82F6',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    modalFooter: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      gap: 12,
    },
    cancelModalButton: {
      flex: 1,
      backgroundColor: '#f0f0f0',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelModalButtonText: {
      fontSize: 16,
      color: '#666',
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency & Safety</Text>
        <Text style={styles.subtitle}>Quick access to emergency features</Text>
      </View>

      {/* Panic Button */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Response</Text>
        
        {isEmergencyActive ? (
          <View style={styles.activeEmergencyContainer}>
            <View style={styles.activeEmergencyHeader}>
              <Ionicons name="warning" size={32} color="#EF4444" />
              <Text style={styles.activeEmergencyTitle}>EMERGENCY ACTIVE</Text>
            </View>
            <Text style={styles.activeEmergencyText}>
              Emergency services have been notified. Help is on the way.
            </Text>
            <TouchableOpacity
              style={styles.cancelEmergencyButton}
              onPress={handleCancelEmergency}
            >
              <Text style={styles.cancelEmergencyText}>Cancel Emergency</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.panicButton}
            onPress={handlePanicButton}
          >
            <Ionicons name="warning" size={48} color="white" />
            <Text style={styles.panicButtonText}>PANIC BUTTON</Text>
            <Text style={styles.panicButtonSubtext}>Tap in case of emergency</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowIncidentModal(true)}
        >
          <Ionicons name="document-text" size={24} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Report Incident</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Call 911', 'Calling emergency services...', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => {/* Call 911 */} }
          ])}
        >
          <Ionicons name="call" size={24} color="#EF4444" />
          <Text style={styles.actionButtonText}>Call 911</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Call Dispatch', 'Calling dispatch...', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => {/* Call dispatch */} }
          ])}
        >
          <Ionicons name="radio" size={24} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Call Dispatch</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Safety Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Information</Text>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            In case of emergency, use the panic button to immediately alert dispatch and emergency services.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Your location will be automatically shared with emergency responders.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="time" size={20} color="#F59E0B" />
          <Text style={styles.infoText}>
            Emergency response time is typically 5-10 minutes in urban areas.
          </Text>
        </View>
      </View>

      {/* Incident Report Modal */}
      <Modal
        visible={showIncidentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Incident</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIncidentModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Incident Type</Text>
              <View style={styles.typeButtons}>
                {(['panic', 'medical', 'safety', 'vehicle', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      incidentType === type && styles.typeButtonActive
                    ]}
                    onPress={() => setIncidentType(type)}
                  >
                    <Ionicons
                      name={getTypeIcon(type)}
                      size={20}
                      color={incidentType === type ? 'white' : '#666'}
                    />
                    <Text style={[
                      styles.typeButtonText,
                      incidentType === type && styles.typeButtonTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Severity Level</Text>
              <View style={styles.severityButtons}>
                {(['low', 'medium', 'high', 'critical'] as const).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.severityButton,
                      incidentSeverity === severity && styles.severityButtonActive,
                      { borderColor: getSeverityColor(severity) }
                    ]}
                    onPress={() => setIncidentSeverity(severity)}
                  >
                    <Text style={[
                      styles.severityButtonText,
                      incidentSeverity === severity && styles.severityButtonTextActive,
                      { color: incidentSeverity === severity ? 'white' : getSeverityColor(severity) }
                    ]}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={incidentDescription}
                onChangeText={setIncidentDescription}
                placeholder="Describe what happened..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowIncidentModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleReportIncident}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

