import React, { useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import TripCalendar from '../../components/TripCalendar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Trip {
  id: string;
  scheduled_pickup_time: string;
  status: string;
  client_name?: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
  pickup_address: string;
  dropoff_address: string;
}

export default function TripsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: trips = [], isLoading, refetch } = useQuery<Trip[]>({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleTripPress = (tripId: string) => {
    router.push(`/(tabs)/trip-details?tripId=${tripId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
  });

  if (isLoading && !refreshing) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <TripCalendar 
        trips={trips} 
        onTripPress={handleTripPress}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      />
    </View>
  );
}
