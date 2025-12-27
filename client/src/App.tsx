import React, { useState, useEffect, useRef } from "react";
import { Router } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/theme-provider";
import { FireThemeProvider } from "./components/fire-theme-provider";
import { HierarchyProvider } from "./hooks/useHierarchy";
import { LayoutProvider } from "./contexts/layout-context";
import MainLayout from "./components/layout/main-layout";
import Login from "./pages/login";
import { useAuth } from "./hooks/useAuth";
import { useThemePreferences } from "./hooks/useThemePreferences";
import { useSelectedTheme } from "./hooks/useSelectedTheme";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import { WelcomeScreen } from "./components/welcome-screen";

function AppContent() {
  const { user, isLoading } = useAuth();
  const { loadPreferences } = useThemePreferences(); // Load theme preferences on app start (legacy)
  const { isLoading: themeLoading } = useSelectedTheme(); // Load selected theme from database
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null); // null = checking
  
  // Check if login animation is in progress or if animation was already completed
  // Use state to track these so component re-renders when they change
  // MUST be declared before any early returns to follow Rules of Hooks
  const [isLoginAnimating, setIsLoginAnimating] = useState(() => 
    typeof window !== 'undefined' && sessionStorage.getItem("halcyon-login-animating") === "true"
  );
  const [alreadyWelcomed, setAlreadyWelcomed] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem("halcyon-welcomed") === "true"
  );
  
  // Load theme preferences when user is authenticated (legacy - for backward compatibility)
  useEffect(() => {
    if (user && !isLoading) {
      loadPreferences();
    }
  }, [user, isLoading, loadPreferences]);
  
  // Check if we've already shown welcome this session
  // This could be from either the login animation or the welcome screen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const welcomed = sessionStorage.getItem("halcyon-welcomed");
    const isAnimating = sessionStorage.getItem("halcyon-login-animating") === "true";
    console.log("🎬 Welcome check - welcomed:", welcomed, "isAnimating:", isAnimating, "user:", user?.email);
    
    if (welcomed === "true") {
      console.log("🎬 Welcome already shown this session, skipping");
      setShowWelcome(false);
    } else if (user && !isAnimating) {
      // User authenticated but no animation in progress - skip WelcomeScreen
      console.log("🎬 User authenticated but no animation - will skip WelcomeScreen");
      setShowWelcome(false);
    } else {
      setShowWelcome(false);
    }
  }, [user]);

  // Handle welcome completion
  const handleWelcomeComplete = () => {
    console.log("🎬 Welcome animation complete!");
    sessionStorage.setItem("halcyon-welcomed", "true");
    setShowWelcome(false);
  };

  // Clear flags when user logs out, or update state immediately when user logs in with flag set
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!user) {
      // User logged out - clear flags
      sessionStorage.removeItem("halcyon-welcomed");
      sessionStorage.removeItem("halcyon-login-animating");
      setIsLoginAnimating(false);
      setAlreadyWelcomed(false);
    } else {
      // User just logged in - check flags immediately and update state synchronously
      const animating = sessionStorage.getItem("halcyon-login-animating") === "true";
      const welcomed = sessionStorage.getItem("halcyon-welcomed") === "true";
      
      // Update state immediately to prevent flash
      if (prevAnimatingRef.current !== animating) {
        prevAnimatingRef.current = animating;
        setIsLoginAnimating(animating);
      }
      if (prevWelcomedRef.current !== welcomed) {
        prevWelcomedRef.current = welcomed;
        setAlreadyWelcomed(welcomed);
      }
    }
  }, [user]);

  // Use refs to track previous values and prevent unnecessary updates
  const prevAnimatingRef = useRef(isLoginAnimating);
  const prevWelcomedRef = useRef(alreadyWelcomed);

  // Listen for storage changes to update state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkFlags = () => {
      const animating = sessionStorage.getItem("halcyon-login-animating") === "true";
      const welcomed = sessionStorage.getItem("halcyon-welcomed") === "true";
      
      // Only update state if values actually changed
      if (prevAnimatingRef.current !== animating) {
        prevAnimatingRef.current = animating;
        setIsLoginAnimating(animating);
      }
      if (prevWelcomedRef.current !== welcomed) {
        prevWelcomedRef.current = welcomed;
        setAlreadyWelcomed(welcomed);
      }
    };
    
    // Check immediately
    checkFlags();
    
    // Listen for storage events (when flags change in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "halcyon-login-animating" || e.key === "halcyon-welcomed") {
        checkFlags();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also poll for changes (since storage events don't fire in same tab)
    // Poll less frequently to avoid excessive re-renders
    const interval = setInterval(checkFlags, 200);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []); // Empty deps - only run once on mount

  // CRITICAL: Check animation flag FIRST, before any other logic
  // This must happen synchronously on every render to prevent flash
  const animatingDirect = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-login-animating") === "true";
  const welcomedDirect = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-welcomed") === "true";
  
  // If animation is in progress and not yet welcomed, ALWAYS show Login (even during loading)
  if (animatingDirect && !welcomedDirect) {
    console.log("📱 Rendering Login component (animation flag set) - user:", user?.email, "isLoading:", isLoading);
    return <Login />;
  }

  // Show loading spinner during initial auth check
  // Don't wait for theme loading - it's non-blocking
  if (isLoading || showWelcome === null) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Prioritize sessionStorage over state - if sessionStorage says animating, show Login
  // Only use state as fallback if sessionStorage is not set
  const isAnimating = animatingDirect !== null ? animatingDirect : isLoginAnimating;
  const isWelcomed = welcomedDirect !== null ? welcomedDirect : alreadyWelcomed;
  
  console.log("🔍 App.tsx render - user:", user?.email, "animatingDirect:", animatingDirect, "isAnimating:", isAnimating, "isWelcomed:", isWelcomed, "showWelcome:", showWelcome);
  
  // Show login if not authenticated OR if login animation is in progress (but not if already welcomed)
  if (!user || (isAnimating && !isWelcomed)) {
    console.log("📱 Rendering Login component - user:", user?.email, "isAnimating:", isAnimating, "isWelcomed:", isWelcomed);
    return <Login />;
  }

  // Show welcome screen for authenticated users (once per session)
  // But skip if login animation was shown (halcyon-welcomed will be set)
  if (showWelcome && sessionStorage.getItem("halcyon-welcomed") !== "true") {
    console.log("🎬 Showing welcome screen for:", user.first_name || user.user_name || user.email);
    return (
      <WelcomeScreen
        firstName={user.first_name || user.user_name?.split(' ')[0]}
        userName={user.user_name || user.email?.split('@')[0]}
        onComplete={handleWelcomeComplete}
        minDisplayTime={3500}
      />
    );
  }

  // Show main app
  return (
    <HierarchyProvider>
      <LayoutProvider>
        <MainLayout />
      </LayoutProvider>
    </HierarchyProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FireThemeProvider>
            <AuthProvider>
              <Router>
                <AppContent />
              </Router>
              <Toaster />
            </AuthProvider>
          </FireThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

