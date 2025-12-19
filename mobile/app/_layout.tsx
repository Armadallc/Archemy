import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../services/networkInspector'; // Initialize network inspector

const queryClient = new QueryClient();

export default function RootLayout() {
  // Load fonts for native platforms only
  // For web, fonts are loaded via CSS @font-face in assets/fonts.css
  const fontConfig = useMemo(() => {
    if (Platform.OS === 'web') {
      // Web fonts loaded via CSS, not expo-font
      return {};
    }
    // Native platforms: load TTF fonts via expo-font
    return {
      'Nohemi-Thin': require('../assets/fonts/Nohemi-Thin.ttf'),
      'Nohemi-ExtraLight': require('../assets/fonts/Nohemi-ExtraLight.ttf'),
      'Nohemi-Light': require('../assets/fonts/Nohemi-Light.ttf'),
      'Nohemi-Regular': require('../assets/fonts/Nohemi-Regular.ttf'),
      'Nohemi-Medium': require('../assets/fonts/Nohemi-Medium.ttf'),
      'Nohemi-SemiBold': require('../assets/fonts/Nohemi-SemiBold.ttf'),
      'Nohemi-Bold': require('../assets/fonts/Nohemi-Bold.ttf'),
      'Nohemi-ExtraBold': require('../assets/fonts/Nohemi-ExtraBold.ttf'),
      'Nohemi-Black': require('../assets/fonts/Nohemi-Black.ttf'),
    };
  }, []);

  // Always call useFonts hook (React rules)
  const [fontsLoaded, fontError] = useFonts(fontConfig);

  // Also load fonts.css file for PWA (as backup/fallback)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Check if fonts.css link is already added
      const existingLink = document.getElementById('halcyon-fonts-css');
      if (existingLink) return;

      // Detect base path for PWA (works for both web browser and installed PWA)
      const getBasePath = () => {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          // Check for base tag first
          const baseTag = document.querySelector('base');
          if (baseTag && baseTag.getAttribute('href')) {
            const baseHref = baseTag.getAttribute('href') || '';
            return baseHref.replace(/\/$/, ''); // Remove trailing slash
          }
          
          // Get base path from current location
          const path = window.location.pathname;
          // Remove the last segment (usually the page name)
          const segments = path.split('/').filter(Boolean);
          // If we're at root or have minimal path, use empty string (absolute path)
          if (segments.length <= 1) {
            return '';
          }
          // Otherwise, use relative path
          return '/' + segments.slice(0, -1).join('/');
        }
        return '';
      };

      const basePath = getBasePath();
      const fontsCssPath = `${basePath}/assets/fonts.css`.replace(/\/\//g, '/'); // Fix double slashes

      // Add link to fonts.css file
      const link = document.createElement('link');
      link.id = 'halcyon-fonts-css';
      link.rel = 'stylesheet';
      link.href = fontsCssPath;
      link.onerror = () => {
        console.warn('fonts.css file not found, using injected styles only');
      };
      document.head.appendChild(link);

      return () => {
        const linkToRemove = document.getElementById('halcyon-fonts-css');
        if (linkToRemove) {
          linkToRemove.remove();
        }
      };
    }
  }, []);

  // Inject font CSS for web platform
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Check if font styles are already injected
      const existingStyle = document.getElementById('halcyon-fonts');
      if (existingStyle) return;

      // Detect base path for PWA (works for both web browser and installed PWA)
      const getBasePath = () => {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          // Check for base tag first
          const baseTag = document.querySelector('base');
          if (baseTag && baseTag.getAttribute('href')) {
            const baseHref = baseTag.getAttribute('href') || '';
            return baseHref.replace(/\/$/, ''); // Remove trailing slash
          }
          
          // Get base path from current location
          const path = window.location.pathname;
          // Remove the last segment (usually the page name)
          const segments = path.split('/').filter(Boolean);
          // If we're at root or have minimal path, use empty string (absolute path)
          if (segments.length <= 1) {
            return '';
          }
          // Otherwise, use relative path
          return '/' + segments.slice(0, -1).join('/');
        }
        return '';
      };

      // Inject @font-face declarations directly as inline styles
      const style = document.createElement('style');
      style.id = 'halcyon-fonts';
      // Use dynamic base path for PWA builds (works on mobile devices)
      const basePath = getBasePath();
      const fontBasePath = `${basePath}/assets/fonts`.replace(/\/\//g, '/'); // Fix double slashes
      
      // Helper to create font src with fallback paths for PWA compatibility
      const createFontSrc = (fontName: string) => {
        // Try absolute path first (works in web browser)
        const absolutePath = `${fontBasePath}/${fontName}`;
        // Try relative path as fallback (works in installed PWA)
        const relativePath = `./assets/fonts/${fontName}`;
        // Use both paths - browser will try first, then fallback
        return `src: url('${absolutePath}') format('woff2'), url('${relativePath}') format('woff2');`;
      };
      
      style.textContent = `
        /* Nohemi Font Family */
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Thin.woff2')}
          font-weight: 100;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-ExtraLight.woff2')}
          font-weight: 200;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Light.woff2')}
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Regular.woff2')}
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Medium.woff2')}
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-SemiBold.woff2')}
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Bold.woff2')}
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-ExtraBold.woff2')}
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Black.woff2')}
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }
        /* Space Grotesk Font Family */
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Light.woff2')}
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Regular.woff2')}
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Medium.woff2')}
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-SemiBold.woff2')}
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Bold.woff2')}
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);

      return () => {
        // Cleanup: remove style when component unmounts
        const styleToRemove = document.getElementById('halcyon-fonts');
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error (using system fonts):', fontError);
    }
  }, [fontError]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}





