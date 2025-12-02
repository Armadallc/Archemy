"use client";

import React, { useState, useEffect, useMemo } from "react";

interface WelcomeScreenProps {
  userName?: string | null;
  firstName?: string | null;
  onComplete?: () => void;
  minDisplayTime?: number;
}

// Smooth text formation component - letters reveal with staggered easing
function FormingText({
  text,
  isActive,
  isExiting,
  onComplete,
  formDuration = 1200,
}: {
  text: string;
  isActive: boolean;
  isExiting?: boolean;
  onComplete?: () => void;
  formDuration?: number;
}) {
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  const letters = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    if (!isActive || hasCompleted) {
      return;
    }

    const startTime = Date.now();
    let animationId: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / formDuration, 1);
      
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - newProgress, 3);
      setProgress(eased);

      if (newProgress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setHasCompleted(true);
        if (onComplete) {
          setTimeout(onComplete, 600); // Hold after forming
        }
      }
    };

    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isActive, formDuration, onComplete, hasCompleted]);

  // Keep formed state when exiting
  const displayProgress = hasCompleted ? 1 : progress;
  
  // Determine if we should be at the final position (75%)
  const isAtFinalPosition = isActive || hasCompleted;

  return (
    <div
      className="absolute inset-y-0 flex items-center transition-all ease-out"
      style={{
        opacity: isExiting ? 0 : isAtFinalPosition ? 1 : 0,
        filter: isExiting ? "blur(12px)" : isAtFinalPosition ? "blur(0px)" : "blur(8px)",
        transitionDuration: isExiting ? "1200ms" : "1500ms",
        // Slide from 25% (left of center) to 75% (right of center)
        left: isAtFinalPosition ? "75%" : "25%",
        transform: "translateX(-50%)",
      }}
    >
      <span
        className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-tight whitespace-nowrap lowercase"
        style={{ 
          color: "var(--color-ice)",
          fontFamily: "'Nohemi', sans-serif",
          fontWeight: 400,
        }}
      >
        {letters.map((letter, index) => {
          // Calculate when this letter should appear (staggered)
          const letterThreshold = index / letters.length;
          const letterProgress = Math.max(0, Math.min(1, (displayProgress - letterThreshold * 0.7) / 0.3));
          
          // Ease the individual letter
          const letterEased = 1 - Math.pow(1 - letterProgress, 2);
          
          return (
            <span
              key={index}
              style={{
                opacity: letterEased,
                filter: `blur(${(1 - letterEased) * 4}px)`,
                transform: `translateX(${(1 - letterEased) * -8}px)`,
                display: "inline-block",
                transition: "none", // Using JS animation instead
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          );
        })}
      </span>
    </div>
  );
}

export function WelcomeScreen({
  userName,
  firstName,
  onComplete,
  minDisplayTime = 6000,
}: WelcomeScreenProps) {
  const [phase, setPhase] = useState<"initial" | "brand" | "crossfade" | "welcome" | "fadeout">("initial");
  const [canComplete, setCanComplete] = useState(false);

  // Get the display name
  const displayName = firstName || userName || "there";
  const welcomeText = `welcome, ${displayName}`;

  // Ensure minimum display time
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanComplete(true);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  // Start with brief dark screen, then show brand
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🎬 Starting brand animation...");
      setPhase("brand");
    }, 600); // Brief pause on dark screen
    
    return () => clearTimeout(timer);
  }, []);

  // Handle brand formation complete
  const handleBrandComplete = () => {
    console.log("🎬 Brand formed, starting crossfade...");
    setPhase("crossfade");
    // After brief overlap, show welcome
    setTimeout(() => {
      setPhase("welcome");
    }, 400);
  };

  // Handle welcome formation complete
  const handleWelcomeComplete = () => {
    console.log("🎬 Welcome formed, holding...");
    setTimeout(() => {
      console.log("🎬 Starting fadeout...");
      setPhase("fadeout");
    }, 1200);
  };

  // Handle final completion
  useEffect(() => {
    if (phase === "fadeout" && canComplete && onComplete) {
      console.log("🎬 Transitioning to dashboard...");
      const timer = setTimeout(onComplete, 1400); // Match longer fade-out
      return () => clearTimeout(timer);
    }
  }, [phase, canComplete, onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-opacity ease-out
        ${phase === "fadeout" ? "opacity-0" : "opacity-100"}
      `}
      style={{ 
        backgroundColor: "#1a1c1e",
        transitionDuration: phase === "fadeout" ? "1200ms" : "700ms",
      }}
    >
      {/* Single row container for overlapping text */}
      <div className="relative w-full h-24">
        {/* Brand: halcyon. */}
        <FormingText
          text="halcyon."
          isActive={phase === "brand"}
          isExiting={phase !== "brand"}
          onComplete={handleBrandComplete}
          formDuration={1750}
        />

        {/* Welcome message */}
        <FormingText
          text={welcomeText}
          isActive={phase === "welcome"}
          isExiting={phase === "fadeout"}
          onComplete={handleWelcomeComplete}
          formDuration={1500}
        />
      </div>

      {/* Subtle loading indicator */}
      <div
        className={`
          absolute bottom-12 transition-opacity duration-500
          ${phase === "fadeout" ? "opacity-0" : "opacity-20"}
        `}
      >
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: "var(--color-ice)",
                animation: "pulse-dot 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.4; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default WelcomeScreen;
