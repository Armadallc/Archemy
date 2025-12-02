"use client";

import React, { useEffect, useState, useMemo } from "react";
import { cn } from "../../lib/utils";

interface TextRevealProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  from?: "top" | "bottom" | "left" | "right";
  split?: "letter" | "word";
  blur?: number;
  delay?: number;
  duration?: number;
  staggerDelay?: number;
  onComplete?: () => void;
}

export function TextReveal({
  children,
  className,
  style,
  from = "bottom",
  split = "word",
  blur = 4,
  delay = 0,
  duration = 0.8,
  staggerDelay = 0.05,
  onComplete,
}: TextRevealProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Split text into elements
  const elements = useMemo(() => {
    if (split === "letter") {
      return children.split("").map((char, i) => ({
        content: char === " " ? "\u00A0" : char,
        key: i,
      }));
    }
    return children.split(" ").map((word, i) => ({
      content: word,
      key: i,
    }));
  }, [children, split]);

  // Trigger animation after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  // Call onComplete when animation finishes
  useEffect(() => {
    if (isVisible && onComplete) {
      // Calculate when the last element finishes animating
      // Last element starts at: staggerDelay * (elements.length - 1)
      // Then takes: duration to complete
      const lastElementStart = staggerDelay * (elements.length - 1);
      const totalDuration = (lastElementStart + duration) * 1000;
      
      console.log(`🎬 TextReveal: "${children.substring(0, 20)}..." will complete in ${totalDuration}ms`);
      
      const timer = setTimeout(() => {
        console.log(`🎬 TextReveal: "${children.substring(0, 20)}..." animation complete!`);
        onComplete();
      }, totalDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete, duration, staggerDelay, elements.length, children]);

  // Calculate transform based on direction
  const getInitialTransform = () => {
    switch (from) {
      case "top":
        return "translateY(-20px)";
      case "bottom":
        return "translateY(20px)";
      case "left":
        return "translateX(-20px)";
      case "right":
        return "translateX(20px)";
      default:
        return "translateY(20px)";
    }
  };

  return (
    <span className={cn("inline-flex flex-wrap justify-center", className)} style={style}>
      {elements.map((element, index) => (
        <span
          key={element.key}
          className="inline-block transition-all"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translate(0)" : getInitialTransform(),
            filter: isVisible ? "blur(0px)" : `blur(${blur}px)`,
            transitionProperty: "opacity, transform, filter",
            transitionDuration: `${duration}s`,
            transitionDelay: `${index * staggerDelay}s`,
            transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {element.content}
          {split === "word" && index < elements.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
}

export default TextReveal;

