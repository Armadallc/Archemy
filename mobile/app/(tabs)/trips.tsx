import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import TripCalendar from '../../components/TripCalendar';
import { router } from 'expo-router';

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

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleTripPress = (tripId: string) => {
    router.push(`/(tabs)/trip-details?tripId=${tripId}`);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

  if (isLoading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <TripCalendar trips={trips} onTripPress={handleTripPress} />
    </View>
  );
}
