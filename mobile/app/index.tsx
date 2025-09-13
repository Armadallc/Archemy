import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Show loading screen
  }

  if (user) {
    return <Redirect href="/(tabs)/trips" />;
  }

  return <Redirect href="/(auth)/login" />;
}