import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { ThemeProvider } from "@/components/theme-provider";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import MainLayout from "@/components/layout/main-layout";
import MobileNavigation from "@/components/MobileNavigation";
import Login from "@/pages/login";
import Register from "@/pages/register";
import DriverPortalMobile from "@/pages/driver-portal-mobile";

const queryClient = new QueryClient();

function AppContent() {
  const { user, isLoading } = useAuth();

  // Debug authentication state
  console.log('🔍 App auth state:', { user: user?.email, role: user?.role, isLoading });

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OrganizationProvider>
            <div className="min-h-screen">
              <EnvironmentBanner />
              <AppContent />
            </div>
            <Toaster />
          </OrganizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;