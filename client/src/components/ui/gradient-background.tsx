"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

type GradientBackgroundProps = React.HTMLAttributes<HTMLDivElement>;

// Generate random stars
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.6 + 0.2,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
  }));
}

function GradientBackground({ className, ...props }: GradientBackgroundProps) {
  const stars = React.useMemo(() => generateStars(120), []);
  
  return (
    <div
      data-slot="gradient-background"
      className={cn("size-full overflow-hidden", className)}
      style={{ backgroundColor: "#0d0e0f" }} // Deeper charcoal/almost black
      {...props}
    >
      {/* Distant milky way dust - very subtle */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 30% 20%, #e8fffe 0%, transparent 50%),
            radial-gradient(ellipse 80% 40% at 70% 80%, #e8fffe 0%, transparent 40%)
          `,
        }}
      />
      
      {/* Stars layer */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: "#e8fffe",
            }}
            animate={{
              opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.5, star.opacity * 0.8, star.opacity * 0.3],
              scale: [0.8, 1, 0.9, 1.1, 0.8],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        ))}
      </div>
      
      {/* Faint constellation lines - very subtle */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
        <line x1="10%" y1="15%" x2="18%" y2="22%" stroke="#e8fffe" strokeWidth="0.5" />
        <line x1="18%" y1="22%" x2="25%" y2="18%" stroke="#e8fffe" strokeWidth="0.5" />
        <line x1="25%" y1="18%" x2="30%" y2="25%" stroke="#e8fffe" strokeWidth="0.5" />
        
        <line x1="70%" y1="60%" x2="78%" y2="55%" stroke="#e8fffe" strokeWidth="0.5" />
        <line x1="78%" y1="55%" x2="85%" y2="62%" stroke="#e8fffe" strokeWidth="0.5" />
        <line x1="85%" y1="62%" x2="82%" y2="70%" stroke="#e8fffe" strokeWidth="0.5" />
        
        <line x1="45%" y1="75%" x2="52%" y2="80%" stroke="#e8fffe" strokeWidth="0.5" />
        <line x1="52%" y1="80%" x2="48%" y2="88%" stroke="#e8fffe" strokeWidth="0.5" />
      </svg>
      
      {/* Dark cloud/fog layer 1 - drifts slowly */}
      <motion.div
        className="absolute w-[150%] h-[150%] -left-[25%] -top-[25%]"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 30% 30%, rgba(13, 14, 15, 0.9) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 70% 60%, rgba(13, 14, 15, 0.85) 0%, transparent 50%)
          `,
        }}
        animate={{
          x: ["-5%", "5%", "-3%", "7%", "-5%"],
          y: ["-3%", "5%", "-5%", "3%", "-3%"],
        }}
        transition={{
          duration: 40,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      
      {/* Ice cloud layer - subtle illuminated edges */}
      <motion.div
        className="absolute w-[120%] h-[120%] -left-[10%] -top-[10%] opacity-[0.04]"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, #e8fffe 0%, transparent 50%),
            radial-gradient(ellipse 60% 70% at 80% 70%, #e8fffe 0%, transparent 40%)
          `,
          filter: "blur(60px)",
        }}
        animate={{
          x: ["0%", "8%", "-5%", "3%", "0%"],
          y: ["0%", "-5%", "8%", "-3%", "0%"],
        }}
        transition={{
          duration: 50,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      
      {/* Dark cloud layer 2 - creates depth */}
      <motion.div
        className="absolute w-[130%] h-[130%] -left-[15%] -top-[15%]"
        style={{
          background: `
            radial-gradient(ellipse 70% 45% at 60% 20%, rgba(26, 28, 30, 0.7) 0%, transparent 55%),
            radial-gradient(ellipse 55% 60% at 25% 75%, rgba(26, 28, 30, 0.6) 0%, transparent 45%)
          `,
        }}
        animate={{
          x: ["3%", "-7%", "5%", "-3%", "3%"],
          y: ["5%", "-3%", "-7%", "5%", "5%"],
        }}
        transition={{
          duration: 35,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      
      {/* Subtle top vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(13, 14, 15, 0.4) 0%, transparent 30%, transparent 70%, rgba(13, 14, 15, 0.3) 100%)",
        }}
      />
    </div>
  );
}

export { GradientBackground, type GradientBackgroundProps };
