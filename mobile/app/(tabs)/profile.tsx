import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: trips = [] } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { name?: string; email?: string; avatar_url?: string }) => {
      // In a real app, this would call an API endpoint to update the profile
      // For now, we'll just simulate the update
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data: profileData });
        }, 1000);
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      // In a real app, you would invalidate the user query here
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update profile');
    },
  });

  const getDriverStats = () => {
    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const inProgressTrips = trips.filter(t => t.status === 'in_progress').length;
    const scheduledTrips = trips.filter(t => t.status === 'scheduled' || t.status === 'confirmed').length;
    
    return { totalTrips, completedTrips, inProgressTrips, scheduledTrips };
  };

  const stats = getDriverStats();

  const handleCallSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@monarch.com');
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Photo Library', onPress: () => pickImage('library') },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const permission = source === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera/photo library permission to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        // In a real app, you would upload the image to a server here
        // For now, we'll just simulate the upload
        setTimeout(() => {
          setIsUploading(false);
          Alert.alert('Success', 'Profile photo updated successfully');
        }, 2000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      setIsUploading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    updateProfileMutation.mutate({
      name: editName.trim(),
      email: editEmail.trim(),
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleImagePicker}
          disabled={isUploading}
        >
          <View style={styles.avatar}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color="#666" />
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.editIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full Name"
            />
            <TextInput
              style={styles.editInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name || 'Driver'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.role}>{user?.role?.replace('_', ' ').toUpperCase()}</Text>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={16} color="#3B82F6" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Trip Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Trip Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completedTrips}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.inProgressTrips}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.scheduledTrips}</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{user?.role?.replace('_', ' ')}</Text>
          </View>
          {user?.programId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Program:</Text>
              <Text style={styles.infoValue}>{user.programId}</Text>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Settings</Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="notifications" size={20} color="#3B82F6" />
            <Text style={styles.supportButtonText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <Text style={styles.supportButtonText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="help-circle" size={20} color="#3B82F6" />
            <Text style={styles.supportButtonText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Support Options */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Support</Text>
          <TouchableOpacity style={styles.supportButton} onPress={handleCallSupport}>
            <Ionicons name="call" size={20} color="#3B82F6" />
            <Text style={styles.supportButtonText}>Call Support</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} onPress={handleEmailSupport}>
            <Ionicons name="mail" size={20} color="#3B82F6" />
            <Text style={styles.supportButtonText}>Email Support</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  profileInfo: {
    alignItems: 'center',
  },
  editForm: {
    width: '100%',
    alignItems: 'center',
  },
  editInput: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
  },
  editProfileText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  role: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  supportButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
});


