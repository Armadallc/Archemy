import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState((user as any)?.phone || '');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Construct full avatar URL from relative path
  const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
    if (!avatarUrl) return null;
    // If it's already a full URL, return it as is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }
    // Otherwise, construct the full URL using the API base URL
    const apiBaseUrl = apiClient.getBaseURL();
    return `${apiBaseUrl}${avatarUrl}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { name?: string; email?: string }) => {
      return apiClient.updateDriverProfile(profileData);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      // Invalidate user query to refresh profile data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Refresh auth to get updated user data
      // Note: In a real app, you might want to update the auth context directly
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    },
  });


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

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0] && user?.id) {
        setIsUploading(true);
        
        try {
          const asset = result.assets[0];
          const imageUri = asset.uri;
          const imageType = asset.type || 'image/jpeg';

          // Upload the image to the server
          const response = await apiClient.uploadAvatar(user.id, imageUri, imageType);

          if (response.success && response.avatar_url) {
            // Refresh user data to get updated avatar_url
            await refreshUser();
            
            // Invalidate user query to refresh profile data
            queryClient.invalidateQueries({ queryKey: ['user'] });
            
            Alert.alert('Success', 'Profile photo updated successfully');
          } else {
            throw new Error('Upload failed - no avatar URL returned');
          }
        } catch (error: any) {
          console.error('Avatar upload error:', error);
          Alert.alert(
            'Upload Failed',
            error.message || 'Failed to upload avatar. Please try again.'
          );
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', error.message || 'Failed to pick image');
      setIsUploading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone((user as any)?.phone || '');
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Please fill in name and email');
      return;
    }
    updateProfileMutation.mutate({
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim() || undefined,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone((user as any)?.phone || '');
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    header: {
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.backgroundSecondary,
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
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.card,
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
      backgroundColor: theme.colors.input,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...theme.typography.body,
      color: theme.colors.foreground,
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
      backgroundColor: theme.colors.backgroundSecondary,
      paddingVertical: 12,
      borderRadius: 8,
      marginRight: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      marginLeft: 8,
      alignItems: 'center',
    },
    saveButtonText: {
      ...theme.typography.body,
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    editProfileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 20,
    },
    editProfileText: {
      ...theme.typography.bodySmall,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    name: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
      marginBottom: 4,
    },
    email: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      marginBottom: 8,
    },
    role: {
      ...theme.typography.bodySmall,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 24,
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.colors.shadowOpacity,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    infoLabel: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      fontWeight: '500',
    },
    infoValue: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    supportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    supportButtonText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      marginLeft: 12,
      flex: 1,
    },
  });

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleImagePicker}
          disabled={isUploading}
        >
          <View style={styles.avatar}>
            {getAvatarUrl(user?.avatar_url) ? (
              <Image source={{ uri: getAvatarUrl(user?.avatar_url)! }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={theme.colors.mutedForeground} />
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={theme.colors.primaryForeground} />
              </View>
            )}
          </View>
          <View style={styles.editIcon}>
            <Ionicons name="camera" size={16} color={theme.colors.primaryForeground} />
          </View>
        </TouchableOpacity>
        
        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.inputPlaceholder}
            />
            <TextInput
              style={styles.editInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              placeholderTextColor={theme.colors.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.editInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.inputPlaceholder}
              keyboardType="phone-pad"
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
                  <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
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
              <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Account Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          {(user as any)?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{(user as any).phone}</Text>
            </View>
          )}
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


      </View>

    </ScrollView>
  );
}

