"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../components/theme-provider";

interface LoginShuffleAnimationProps {
  firstName: string;
  onComplete: () => void;
}

const SHUFFLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
const SHUFFLE_SPEED = 30; // ms between character changes during shuffle
const REVEAL_DELAY = 80; // ms delay between revealing each letter
const PAUSE_AFTER_WELCOME = 500; // ms pause after WELCOME forms (0.5 seconds)
const FADE_OUT_DURATION = 1500; // ms fade out duration (1.5 seconds)

export function LoginShuffleAnimation({
  firstName,
  onComplete,
}: LoginShuffleAnimationProps) {
  console.log("🎬 LoginShuffleAnimation component created with firstName:", firstName);
  const { theme } = useTheme();
  
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
  
  // Color scheme matching login page
  // Dark mode: 20% darker charcoal (#0a0b0c) with light text
  // Light mode: cloud (#f4f4f4) with dark text
  const backgroundColor = isDark ? '#0a0b0c' : '#f4f4f4';
  const textColor = isDark ? 'rgba(244, 244, 244, 1)' : '#1a1c1e';
  const textShadow = isDark 
    ? '0 0 10px rgba(232, 255, 254, 0.5)' 
    : '0 0 10px rgba(26, 28, 30, 0.3)';
  
  // Check if animation was already completed - if so, complete immediately
  const alreadyWelcomed = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-welcomed") === "true";
  if (alreadyWelcomed) {
    console.log("✅ Animation already completed, calling onComplete immediately");
    // Call onComplete in next tick to avoid state updates during render
    setTimeout(() => onComplete(), 0);
    return null;
  }
  
  const [phase, setPhase] = useState<"halcyon" | "welcome" | "name" | "fadeout" | "complete">("halcyon");
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  
  // Normalize first name: uppercase, max 7 chars
  const normalizedName = firstName
    ? firstName.toUpperCase().slice(0, 7)
    : "USER";
  
  // For display, we always show 7 characters
  // If name is shorter, pad with spaces (but they won't be revealed)
  const displayName = normalizedName.padEnd(7, " ");
  const nameLength = normalizedName.length;
  
  const targetWords = {
    halcyon: "HALCYON",
    welcome: "WELCOME",
    name: displayName, // Always 7 chars for consistent display
  };

  // Get random character for shuffle
  const getRandomChar = () => {
    return SHUFFLE_CHARS[Math.floor(Math.random() * SHUFFLE_CHARS.length)];
  };

  // Get current word based on phase
  const getCurrentWord = () => {
    if (phase === "fadeout" || phase === "complete") {
      return targetWords.name;
    }
    return targetWords[phase] || targetWords.halcyon;
  };

  // Initialize with halcyon word
  const initialWord = targetWords.halcyon;
  const initialLetters = initialWord.split("");
  
  const [displayChars, setDisplayChars] = useState<string[]>(() => {
    const chars = initialLetters.map(() => getRandomChar());
    console.log("🎬 Initializing displayChars with:", chars);
    return chars;
  });
  
  // Get current word and letters based on phase
  // If phase is fadeout/complete, use name word, otherwise use phase word
  const currentWord = getCurrentWord();
  const letters = currentWord.split("");
  
  const shuffleIntervals = useRef<NodeJS.Timeout[]>([]);
  const fadeAnim = useRef(1);
  const [opacity, setOpacity] = useState(1);

  console.log("🎬 LoginShuffleAnimation render - firstName:", firstName, "phase:", phase, "letters:", letters.length, "displayChars:", displayChars.length);


  // Shuffle animation for a specific index
  const shuffleIndex = (
    index: number,
    onComplete: () => void,
    targetLetter: string
  ) => {
    let shuffleCount = 0;
    const maxShuffles = 8 + Math.floor(Math.random() * 5); // 8-12 shuffles

    const interval = setInterval(() => {
      setDisplayChars((prev) => {
        const newChars = [...prev];
        newChars[index] = getRandomChar();
        return newChars;
      });
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(interval);
        setDisplayChars((prev) => {
          const newChars = [...prev];
          newChars[index] = targetLetter;
          return newChars;
        });
        onComplete();
      }
    }, SHUFFLE_SPEED);

    shuffleIntervals.current.push(interval);
  };

  // Reveal letters one at a time (random order)
  const revealLetters = (targetWord: string, nextPhase?: () => void) => {
    const targetLetters = targetWord.split("");
    const indices = Array.from({ length: targetLetters.length }, (_, i) => i);
    
    // Shuffle indices to reveal in random order
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    indices.forEach((index, i) => {
      setTimeout(() => {
        shuffleIndex(index, () => {
          setRevealedIndices((prev) => {
            const newSet = new Set(prev);
            newSet.add(index);

            // Check if all letters are revealed
            if (newSet.size === targetLetters.length) {
              if (nextPhase) {
                nextPhase();
              }
            }

            return newSet;
          });
        }, targetLetters[index]);
      }, i * REVEAL_DELAY);
    });
  };

  // Reset phase to halcyon if it's incorrectly set to fadeout/complete on mount
  useEffect(() => {
    // Check if animation was already completed
    const alreadyWelcomed = typeof window !== 'undefined' && sessionStorage.getItem("halcyon-welcomed") === "true";
    if (alreadyWelcomed) {
      console.log("✅ Animation already completed, calling onComplete immediately");
      onComplete();
      return;
    }
    
    if (phase === "fadeout" || phase === "complete") {
      console.warn("⚠️ Phase incorrectly set to", phase, "- resetting to halcyon");
      setPhase("halcyon");
      return;
    }
  }, []); // Only run on mount

  // Start animation when phase changes
  useEffect(() => {
    console.log("🎬 useEffect triggered - phase:", phase, "currentWord:", getCurrentWord(), "displayChars length:", displayChars.length);
    
    if (phase === "fadeout" || phase === "complete") {
      console.log("⏭️ Skipping animation for phase:", phase);
      return;
    }

    // Clear any existing intervals
    shuffleIntervals.current.forEach((interval) => clearInterval(interval));
    shuffleIntervals.current = [];
    setRevealedIndices(new Set());

    // Initialize display characters for current phase
    const word = getCurrentWord();
    const initialChars = word.split("").map(() => getRandomChar());
    console.log("🎬 Setting displayChars for phase:", phase, "word:", word, "chars:", initialChars);
    setDisplayChars(initialChars);

    // Start revealing letters after a brief delay
    const timer = setTimeout(() => {
      console.log("🎬 Starting animation for phase:", phase, "word:", word, "displayChars:", displayChars.length);
      if (phase === "halcyon") {
        revealLetters(targetWords.halcyon, () => {
          // Move to welcome phase
          setTimeout(() => {
            setPhase("welcome");
            setRevealedIndices(new Set());
            setDisplayChars(
              targetWords.welcome.split("").map(() => getRandomChar())
            );
          }, 100);
        });
      } else if (phase === "welcome") {
        revealLetters(targetWords.welcome, () => {
          // Pause 0.5 sec, then move to name phase
          setTimeout(() => {
            setPhase("name");
            setRevealedIndices(new Set());
            setDisplayChars(
              targetWords.name.split("").map(() => getRandomChar())
            );
          }, PAUSE_AFTER_WELCOME);
        });
      } else if (phase === "name") {
        // For name phase, only reveal up to the name length
        // If name is shorter than 7, remaining chars keep shuffling
        const targetLetters = displayName.split("");
        const indices = Array.from({ length: nameLength }, (_, i) => i);
        
        // Shuffle indices to reveal in random order (only for name length)
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Start shuffling remaining characters immediately if name is shorter
        if (nameLength < 7) {
          for (let i = nameLength; i < 7; i++) {
            const continueShuffling = () => {
              const interval = setInterval(() => {
                setDisplayChars((prev) => {
                  const newChars = [...prev];
                  newChars[i] = getRandomChar();
                  return newChars;
                });
              }, SHUFFLE_SPEED);
              shuffleIntervals.current.push(interval);
            };
            continueShuffling();
          }
        }

        // Reveal name letters
        indices.forEach((index, i) => {
          setTimeout(() => {
            shuffleIndex(index, () => {
              setRevealedIndices((prev) => {
                const newSet = new Set(prev);
                newSet.add(index);

                // Check if all name letters are revealed
                if (newSet.size === nameLength) {
                  // Fade out after name is formed
                  setTimeout(() => {
                    setPhase("fadeout");
                    // Start fade out animation
                    const startTime = Date.now();
                    const animate = () => {
                      const elapsed = Date.now() - startTime;
                      const progress = Math.min(elapsed / FADE_OUT_DURATION, 1);
                      fadeAnim.current = 1 - progress;
                      setOpacity(fadeAnim.current);

                      if (progress < 1) {
                        requestAnimationFrame(animate);
                      } else {
                        setPhase("complete");
                        onComplete();
                      }
                    };
                    requestAnimationFrame(animate);
                  }, 200);
                }

                return newSet;
              });
            }, targetLetters[index]);
          }, i * REVEAL_DELAY);
        });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      shuffleIntervals.current.forEach((interval) => clearInterval(interval));
    };
  }, [phase]);

  // Debug: Log current state
  console.log("🎬 Render - phase:", phase, "letters:", letters.length, "displayChars:", displayChars.length, "revealedIndices:", revealedIndices.size);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: backgroundColor,
      }}
    >
      {/* Text container - always visible, no opacity on container */}
      <div
        className="flex items-center justify-center"
        style={{
          zIndex: 10,
          position: "relative",
        }}
      >
        {letters.length > 0 ? (
          letters.map((letter, index) => {
            const isRevealed = revealedIndices.has(index);
            const shouldShowLetter = phase === "fadeout" || phase === "complete" || isRevealed;
            
            // For name phase, if index is beyond name length, always show shuffle
            const isNamePhase = phase === "name";
            const isBeyondName = isNamePhase && index >= nameLength;
            
            // Show the letter if revealed, or if it's a space (for padding)
            // Handle case where displayChars might not be initialized yet
            const displayLetter = shouldShowLetter && !isBeyondName
              ? (letter === " " ? "\u00A0" : letter)
              : (displayChars[index] || getRandomChar());
            
            return (
              <span
                key={`${phase}-${index}`}
                className="text-4xl lowercase"
                style={{
                  fontFamily: "'Nohemi', sans-serif",
                  fontWeight: 500,
                  color: textColor,
                  minWidth: "32px",
                  textAlign: "center",
                  display: "inline-block",
                  textShadow: textShadow,
                  opacity: opacity,
                }}
              >
                {displayLetter || " "}
              </span>
            );
          })
        ) : (
          <span style={{ color: textColor, fontSize: "48px" }}>Loading...</span>
        )}
      </div>
      
      {/* Overlay that fades in during fadeout - matches background color */}
      {phase === "fadeout" && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: backgroundColor,
            opacity: 1 - opacity,
            transition: `opacity ${FADE_OUT_DURATION}ms ease-out`,
            zIndex: 5,
          }}
        />
      )}
    </div>
  );
}

