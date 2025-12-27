import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2 } from "lucide-react";
import { GradientBackground } from "../components/ui/gradient-background";
import { LoginShuffleAnimation } from "../components/login-shuffle-animation";
import { useTheme } from "../components/theme-provider";

export default function Login() {
  const { login, superAdminLogin, user } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  
  // Detect dark mode and watch for changes
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        setIsDark(theme === 'dark' || root.classList.contains('dark'));
      }
    };
    
    checkDarkMode();
    
    // Watch for dark class changes
    const observer = new MutationObserver(checkDarkMode);
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
    
    return () => observer.disconnect();
  }, [theme]);
  
  // Neumorphic color scheme
  // Dark mode: 20% darker charcoal (#0a0b0c) with aqua borders (#e8fffe)
  // Light mode: cloud (#f4f4f4) with coral borders (#ff6b6b or #ff7f7f)
  const cardBg = isDark ? '#0a0b0c' : '#f4f4f4';
  const borderColor = isDark ? '#e8fffe' : '#ff7f7f';
  const textColor = isDark ? 'rgba(244, 244, 244, 1)' : '#1a1c1e';
  const labelColor = isDark ? '#e8fffe' : '#ff7f7f';
  const inputBg = isDark ? 'rgba(10, 11, 12, 0.8)' : 'rgba(244, 244, 244, 0.8)';
  const inputTextColor = isDark ? '#e8fffe' : '#1a1c1e';
  
  // Neumorphic shadow styles
  const neumorphicShadow = isDark
    ? '2.5px 2.5px 5px rgba(0, 0, 0, 0.5), -2.5px -2.5px 5px rgba(26, 28, 30, 0.3)'
    : '2.5px 2.5px 5px rgba(0, 0, 0, 0.1), -2.5px -2.5px 5px rgba(255, 255, 255, 0.8)';
  
  const neumorphicShadowInset = isDark
    ? 'inset 2.5px 2.5px 5px rgba(0, 0, 0, 0.5), inset -2.5px -2.5px 5px rgba(26, 28, 30, 0.3)'
    : 'inset 2.5px 2.5px 5px rgba(0, 0, 0, 0.1), inset -2.5px -2.5px 5px rgba(255, 255, 255, 0.8)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("🔐 Login attempt:", { email, passwordLength: password.length });
    
    // Set animation flag BEFORE login to prevent dashboard flash
    sessionStorage.setItem("halcyon-login-animating", "true");
    sessionStorage.setItem("halcyon-just-logged-in", "true");
    console.log("✅ Animation flags set BEFORE login - animating:", sessionStorage.getItem("halcyon-login-animating"));
    
    const result = await login(email, password);
    console.log("🔐 Login result:", result);
    
    if (!result.success) {
      console.error("❌ Login failed:", result.error);
      setError(result.error || "Login failed");
      setIsLoading(false);
      // Clear flags on failure
      sessionStorage.removeItem("halcyon-login-animating");
      sessionStorage.removeItem("halcyon-just-logged-in");
    } else {
      console.log("✅ Login successful, flags already set");
      // Flags were set before login, so App.tsx should keep Login component mounted
      // Animation will be triggered by useEffect when user is set
    }
  };

  // When user is set after successful login, start animation (only once)
  useEffect(() => {
    // Check if animation was already completed
    const alreadyWelcomed = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-welcomed") === "true";
    if (alreadyWelcomed) {
      console.log("✅ Animation already completed, skipping");
      return;
    }

    // Check flag on every render to catch it being set
    const isAnimating = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-login-animating") === "true";
    console.log("🔍 Login useEffect - user:", user?.email, "showAnimation:", showAnimation, "isAnimating:", isAnimating, "isLoading:", isLoading, "alreadyWelcomed:", alreadyWelcomed);
    
    if (user && !showAnimation && isAnimating) {
      const name = user.first_name || user.user_name?.split(' ')[0] || "USER";
      console.log("🎬 Starting login animation for:", name);
      setFirstName(name);
      setShowAnimation(true);
      setIsLoading(false); // Make sure loading is cleared
    } else if (user && !isAnimating && !showAnimation && !alreadyWelcomed) {
      // User is set but animation flag is missing - check if we just logged in
      const justLoggedIn = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-just-logged-in") === "true";
      if (justLoggedIn) {
        console.log("🔄 User just logged in, setting animation flag and starting animation");
        sessionStorage.setItem("halcyon-login-animating", "true");
        sessionStorage.removeItem("halcyon-just-logged-in");
        const name = user.first_name || user.user_name?.split(' ')[0] || "USER";
        setFirstName(name);
        setShowAnimation(true);
        setIsLoading(false);
      }
    }
  }, [user, showAnimation, isLoading]);

  const handleAnimationComplete = () => {
    console.log("🎬 Animation complete, setting flags immediately");
    // Set flags immediately so App.tsx can navigate
    sessionStorage.setItem("halcyon-welcomed", "true");
    sessionStorage.removeItem("halcyon-login-animating");
    sessionStorage.removeItem("halcyon-just-logged-in");
    console.log("✅ Animation flags set - welcomed:", sessionStorage.getItem("halcyon-welcomed"), "animating:", sessionStorage.getItem("halcyon-login-animating"));
    
    // Clear local state to prevent re-rendering animation
    setShowAnimation(false);
    setFirstName("");
  };

  const handleSuperAdminLogin = async () => {
    setIsLoading(true);
    setError("");

    console.log("🔐 Super admin login attempt");
    
    // Set animation flag BEFORE login to prevent dashboard flash
    sessionStorage.setItem("halcyon-login-animating", "true");
    sessionStorage.setItem("halcyon-just-logged-in", "true");
    console.log("✅ Animation flags set BEFORE super admin login - animating:", sessionStorage.getItem("halcyon-login-animating"));
    
    const result = await superAdminLogin("admin123");
    
    if (!result.success) {
      console.error("❌ Super admin login failed:", result.error);
      setError(result.error || "Super admin login failed");
      setIsLoading(false);
      // Clear flags on failure
      sessionStorage.removeItem("halcyon-login-animating");
      sessionStorage.removeItem("halcyon-just-logged-in");
    } else {
      console.log("✅ Super admin login successful, flags already set");
      // Flags were set before login, so App.tsx should keep Login component mounted
      // Animation will be triggered by useEffect when user is set
    }
  };

  // Check if animation was already completed - if so, don't show login form or animation
  const alreadyWelcomed = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-welcomed") === "true";
  const isAnimating = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-login-animating") === "true";
  
  // If animation is complete, don't render anything (App.tsx will handle navigation)
  if (alreadyWelcomed && user) {
    console.log("✅ Animation complete, returning null to let App.tsx navigate");
    return null; // Return null to let App.tsx handle the navigation
  }
  
  // Show animation overlay when login is successful and not already completed
  if (showAnimation && firstName && !alreadyWelcomed) {
    console.log("🎬 Rendering LoginShuffleAnimation with firstName:", firstName);
    return (
      <LoginShuffleAnimation
        firstName={firstName}
        onComplete={handleAnimationComplete}
      />
    );
  }
  
  console.log("🔍 Login render - showAnimation:", showAnimation, "firstName:", firstName, "user:", user?.email, "isLoading:", isLoading, "alreadyWelcomed:", alreadyWelcomed, "isAnimating:", isAnimating);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Simplified background */}
      <GradientBackground className="absolute inset-0 -z-10" />
      
      {/* Content */}
      <h1 
        className="text-4xl mb-8 lowercase"
        style={{ 
          fontFamily: "'Nohemi', sans-serif", 
          fontWeight: 500, 
          color: textColor,
        }}
      >
        halcyon.
      </h1>
      <Card 
        className="w-full max-w-md"
        style={{
          backgroundColor: cardBg,
          borderColor: borderColor,
          borderWidth: "1px",
          borderRadius: "16px",
          boxShadow: neumorphicShadow,
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: labelColor, fontFamily: "'Space Grotesk', sans-serif" }}>
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
                  backgroundColor: inputBg,
                  borderColor: borderColor,
                  borderWidth: "1px",
                  borderRadius: "8px",
                  color: inputTextColor,
                  boxShadow: neumorphicShadowInset,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                className={isDark ? "placeholder:text-[#e8fffe]/50" : "placeholder:text-[#1a1c1e]/50"}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: labelColor, fontFamily: "'Space Grotesk', sans-serif" }}>
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
                  backgroundColor: inputBg,
                  borderColor: borderColor,
                  borderWidth: "1px",
                  borderRadius: "8px",
                  color: inputTextColor,
                  boxShadow: neumorphicShadowInset,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                className={isDark ? "placeholder:text-[#e8fffe]/50" : "placeholder:text-[#1a1c1e]/50"}
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
                backgroundColor: cardBg,
                color: textColor,
                borderWidth: "1px",
                borderColor: borderColor,
                borderRadius: "8px",
                boxShadow: neumorphicShadow,
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
                <span className="w-full border-t" style={{ borderColor: isDark ? "rgba(232, 255, 254, 0.3)" : "rgba(255, 127, 127, 0.3)" }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-4" 
              disabled={isLoading}
              onClick={handleSuperAdminLogin}
              style={{
                backgroundColor: cardBg,
                borderColor: borderColor,
                borderWidth: "1px",
                borderRadius: "8px",
                color: labelColor,
                boxShadow: neumorphicShadow,
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
                color: isDark ? "rgba(232, 255, 254, 0.6)" : "rgba(26, 28, 30, 0.6)",
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