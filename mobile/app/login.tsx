import { Redirect } from 'expo-router';

/**
 * Redirect /login to /(auth)/login for convenience
 * This allows users to access http://YOUR_IP:8082/login
 */
export default function LoginRedirect() {
  return <Redirect href="/(auth)/login" />;
}



