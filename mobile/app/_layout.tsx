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

      // Use absolute URL with origin for fonts.css (works on all devices)
      const getFontsCssUrl = () => {
        if (typeof window !== 'undefined') {
          // Use origin + absolute path - this works on both desktop and mobile
          return `${window.location.origin}/assets/fonts.css`;
        }
        return '/assets/fonts.css';
      };

      const fontsCssUrl = getFontsCssUrl();

      // Add link to fonts.css file
      const link = document.createElement('link');
      link.id = 'halcyon-fonts-css';
      link.rel = 'stylesheet';
      link.href = fontsCssUrl;
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

      // Inject @font-face declarations directly as inline styles
      const style = document.createElement('style');
      style.id = 'halcyon-fonts';
      
      // Detect where Expo actually puts assets in the build
      // Expo web builds may put assets in _expo/static/ or similar
      const getFontPaths = (fontName: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const paths = [
          // Try Expo's typical asset location
          `${origin}/_expo/static/assets/fonts/${fontName}`,
          // Try standard assets location
          `${origin}/assets/fonts/${fontName}`,
          // Try absolute paths
          `/assets/fonts/${fontName}`,
          `./assets/fonts/${fontName}`,
          // Try _expo without origin
          `/_expo/static/assets/fonts/${fontName}`,
        ];
        return paths;
      };
      
      // Helper to create font src with multiple fallback paths
      const createFontSrc = (fontName: string) => {
        const paths = getFontPaths(fontName);
        // Create src with all possible paths
        const srcUrls = paths.map(path => `url('${path}') format('woff2')`).join(', ');
        return `src: ${srcUrls};`;
      };
      
      // Test font loading and verify fonts are accessible
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Use Font Loading API to check if fonts actually loaded
        const checkFontLoaded = async () => {
          try {
            // Wait a bit for fonts to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if Nohemi font is available
            if (document.fonts && document.fonts.check) {
              const nohemiLoaded = document.fonts.check('1em Nohemi');
              const spaceGroteskLoaded = document.fonts.check('1em "Space Grotesk"');
              
              console.log('[Fonts] Nohemi loaded:', nohemiLoaded);
              console.log('[Fonts] Space Grotesk loaded:', spaceGroteskLoaded);
              
              if (!nohemiLoaded || !spaceGroteskLoaded) {
                console.warn('[Fonts] ⚠️ Some fonts failed to load. Available fonts:', 
                  Array.from(document.fonts).map(f => f.family).join(', '));
                
                // Try to find fonts in common Expo locations
                const testFont = 'Nohemi-Regular.woff2';
                const testPaths = getFontPaths(testFont);
                console.log('[Fonts] Testing font accessibility at paths:', testPaths);
                
                // Test each path
                for (const path of testPaths) {
                  try {
                    const response = await fetch(path, { method: 'HEAD' });
                    if (response.ok) {
                      console.log(`[Fonts] ✅ Font accessible at: ${path}`);
                      break;
                    }
                  } catch (e) {
                    console.log(`[Fonts] ❌ Font not accessible at: ${path}`);
                  }
                }
              } else {
                console.log('[Fonts] ✅ All fonts loaded successfully!');
                // Store success in localStorage for debugging
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('halcyon_fonts_loaded', 'true');
                  localStorage.setItem('halcyon_fonts_check_time', new Date().toISOString());
                }
              }
              
              // Store font loading status for debugging (even if failed)
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('halcyon_fonts_status', JSON.stringify({
                  nohemi: nohemiLoaded,
                  spaceGrotesk: spaceGroteskLoaded,
                  timestamp: new Date().toISOString(),
                }));
              }
            }
          } catch (error) {
            console.error('[Fonts] Error checking font loading:', error);
          }
        };
        
        // Check fonts after a delay
        setTimeout(checkFontLoaded, 2000);
      }
      
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





