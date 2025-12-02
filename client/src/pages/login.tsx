import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2 } from "lucide-react";
import { GradientBackground } from "../components/ui/gradient-background";

export default function Login() {
  const { login, superAdminLogin } = useAuth();
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

  const handleSuperAdminLogin = async () => {
    setIsLoading(true);
    setError("");

    const result = await superAdminLogin("admin123");
    
    if (!result.success) {
      setError(result.error || "Super admin login failed");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <GradientBackground className="absolute inset-0 -z-10" />
      
      {/* Content */}
      <h1 
        className="text-4xl mb-8 lowercase"
        style={{ 
          fontFamily: "'Nohemi', sans-serif", 
          fontWeight: 500, 
          color: "#e8fffe",
        }}
      >
        halcyon.
      </h1>
      <Card 
        className="w-full max-w-md backdrop-blur-sm"
        style={{
          backgroundColor: "rgba(232, 255, 254, 0.05)", // ice 5%
          borderColor: "#e8fffe", // ice 100%
          borderWidth: "1px",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "#e8fffe", fontFamily: "'Space Grotesk', sans-serif" }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  backgroundColor: "rgba(59, 254, 201, 0.05)", // lime 5%
                  borderColor: "#e8fffe",
                  color: "#e8fffe",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                className="placeholder:text-[#e8fffe]/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: "#e8fffe", fontFamily: "'Space Grotesk', sans-serif" }}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  backgroundColor: "rgba(59, 254, 201, 0.05)", // lime 5%
                  borderColor: "#e8fffe",
                  color: "#e8fffe",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                className="placeholder:text-[#e8fffe]/50"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              style={{
                backgroundColor: "#e8fffe",
                color: "#1a1c1e",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
              }}
            >
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
                <span className="w-full border-t" style={{ borderColor: "rgba(232, 255, 254, 0.3)" }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span 
                  className="px-2"
                  style={{ 
                    backgroundColor: "rgba(232, 255, 254, 0.05)",
                    color: "rgba(232, 255, 254, 0.6)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Quick Access
                </span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-4" 
              disabled={isLoading}
              onClick={handleSuperAdminLogin}
              style={{
                backgroundColor: "transparent",
                borderColor: "#e8fffe",
                color: "#e8fffe",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Super Admin (admin@monarch.com)"
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p 
              className="text-sm"
              style={{ 
                color: "rgba(232, 255, 254, 0.6)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Need access? Contact your Program Admin
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}