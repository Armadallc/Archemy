import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, demoLogin, superAdminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Login attempt:", { email, passwordLength: password.length });
    const result = await login(email, password);
    console.log("Login result:", result);
    
    if (!result.success) {
      console.error("Login failed:", result.error);
      setError(result.error || "Login failed");
    } else {
      console.log("Login successful, but still on login page");
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");

    const result = await demoLogin();
    
    if (!result.success) {
      setError(result.error || "Demo login failed");
    }
    
    setIsLoading(false);
  };

  const handleSuperAdminLogin = async () => {
    setIsLoading(true);
    setError("");

    const result = await superAdminLogin();
    
    if (!result.success) {
      setError(result.error || "Super admin login failed");
    }
    
    setIsLoading(false);
  };

  const handleBookingKioskLogin = async () => {
    setIsLoading(true);
    setError("");

    const result = await demoLogin("booking_kiosk");
    
    if (!result.success) {
      setError(result.error || "Booking kiosk login failed");
    }
    
    setIsLoading(false);
  };

  const handleDriverLogin = async () => {
    setIsLoading(true);
    setError("");

    const result = await login("alex@monarch.com", "drive123");
    
    if (!result.success) {
      setError(result.error || "Driver login failed");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Amish Limo Service</CardTitle>
          <CardDescription>
            Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Quick Access</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-4" 
              disabled={isLoading}
              onClick={handleDemoLogin}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Demo Login (Admin Access)"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2" 
              disabled={isLoading}
              onClick={handleBookingKioskLogin}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Booking Kiosk (Cross-Org Access)"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2" 
              disabled={isLoading}
              onClick={handleDriverLogin}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Driver Portal (Alex)"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2" 
              disabled={isLoading}
              onClick={handleSuperAdminLogin}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Super Admin Access"
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New organization?{" "}
              <a href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Register here
              </a>
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Demo Accounts:</p>
            
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
                <strong>Organization Admin:</strong><br />
                Email: john@monarch.com<br />
                Password: password123<br />
                <span className="text-blue-600 dark:text-blue-400">Access: Monarch Competency Center only</span>
              </div>
              
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border">
                <strong>Monarch Owner:</strong><br />
                Email: sarah@monarch.com<br />
                Password: password123<br />
                <span className="text-green-600 dark:text-green-400">Access: All Monarch Organizations</span>
              </div>
              
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border">
                <strong>Organization User (Kiosk):</strong><br />
                Email: lisa@monarch.com<br />
                Password: password123<br />
                <span className="text-purple-600 dark:text-purple-400">Access: Competency Center (Kiosk Mode)</span>
              </div>

              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border">
                <strong>Driver (Cross-Org):</strong><br />
                Email: mike@monarch.com<br />
                Password: password123<br />
                <span className="text-orange-600 dark:text-orange-400">Access: Competency + Mental Health</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}