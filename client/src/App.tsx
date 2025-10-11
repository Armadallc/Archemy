import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "../components/ui/toaster";
import { Switch, Route, Redirect } from "wouter";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { MockAuthProvider } from "./hooks/useMockAuth";
import { HierarchyProvider } from "./hooks/useHierarchy";
import { ThemeProvider } from "./components/theme-provider";
import { EnvironmentBanner } from "./components/EnvironmentBanner";
import MainLayout from "./components/layout/main-layout";
import MobileNavigation from "./components/MobileNavigation";
import Login from "./pages/login";
import Register from "./pages/register";
import DriverPortalMobile from "./pages/driver-portal-mobile";
import { clickTracker } from "./lib/clickTracker";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function AppContent() {
  const { user, isLoading } = useAuth();

  // Debug authentication state
  console.log('🔍 App auth state:', { user: user?.email, role: user?.role, isLoading });
  console.log('🔴 APP COMPONENT IS RENDERING - CHECK AUTH STATE');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/register">
        {user ? <Redirect to="/" /> : <Register />}
      </Route>
      <Route path="/mobile">
        <DriverPortalMobile />
      </Route>
      <Route path="*">
        {user ? (
          <div className="pb-16 md:pb-0">
            <MainLayout />
            <MobileNavigation />
          </div>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <MockAuthProvider>
              <HierarchyProvider>
                <div className="min-h-screen">
                  <EnvironmentBanner />
                  <AppContent />
                </div>
                {/* <Toaster /> */}
              </HierarchyProvider>
            </MockAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;