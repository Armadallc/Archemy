"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

type GradientBackgroundProps = React.HTMLAttributes<HTMLDivElement>;

function GradientBackground({ className, ...props }: GradientBackgroundProps) {
  // Detect dark mode
  const [isDark, setIsDark] = React.useState(false);
  
  React.useEffect(() => {
    const checkDarkMode = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for dark class changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Dark mode: 20% darker charcoal (#0d0e0f -> ~#0a0b0c)
  // Light mode: cloud color (#f4f4f4)
  const backgroundColor = isDark ? '#0a0b0c' : '#f4f4f4';
  
  return (
    <div
      data-slot="gradient-background"
      className={cn("size-full overflow-hidden", className)}
      style={{ backgroundColor }}
      {...props}
    />
  );
}

export { GradientBackground, type GradientBackgroundProps };
