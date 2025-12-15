import React, { useState, useEffect } from "react";
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
  
  // Load theme preferences when user is authenticated (legacy - for backward compatibility)
  useEffect(() => {
    if (user && !isLoading) {
      loadPreferences();
    }
  }, [user, isLoading, loadPreferences]);
  
  // Check if we've already shown welcome this session
  useEffect(() => {
    const welcomed = sessionStorage.getItem("halcyon-welcomed");
    console.log("🎬 Welcome check - sessionStorage:", welcomed, "user:", user?.email);
    
    if (welcomed === "true") {
      console.log("🎬 Welcome already shown this session, skipping");
      setShowWelcome(false);
    } else {
      console.log("🎬 Welcome not yet shown, will display after auth");
      setShowWelcome(true);
    }
  }, [user]);

  // Handle welcome completion
  const handleWelcomeComplete = () => {
    console.log("🎬 Welcome animation complete!");
    sessionStorage.setItem("halcyon-welcomed", "true");
    setShowWelcome(false);
  };

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

  // Show login if not authenticated
  if (!user) {
    // Clear welcome flag when logged out so it shows again on next login
    sessionStorage.removeItem("halcyon-welcomed");
    return <Login />;
  }

  // Show welcome screen for authenticated users (once per session)
  if (showWelcome) {
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

