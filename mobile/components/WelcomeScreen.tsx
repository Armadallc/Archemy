import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface WelcomeScreenProps {
  onComplete: () => void;
}

const SHUFFLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
const SHUFFLE_SPEED = 30; // ms between character changes during shuffle (faster)
const REVEAL_DELAY = 80; // ms delay between revealing each letter (faster)
const PAUSE_AFTER_HALCYON = 1000; // ms pause after HALCYON forms (1 second)
const FADE_OUT_DURATION = 1500; // ms fade out duration (1.5 seconds)

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const [phase, setPhase] = useState<'halcyon' | 'fadeout' | 'complete'>('halcyon');
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [displayChars, setDisplayChars] = useState<string[]>([]);
  const shuffleIntervals = useRef<NodeJS.Timeout[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const targetWord = 'HALCYON';
  const letters = targetWord.split('');

  // Get random character for shuffle
  const getRandomChar = () => {
    return SHUFFLE_CHARS[Math.floor(Math.random() * SHUFFLE_CHARS.length)];
  };

  // Shuffle animation for a specific index
  const shuffleIndex = (index: number, onComplete: () => void) => {
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
          newChars[index] = letters[index];
          return newChars;
        });
        onComplete();
      }
    }, SHUFFLE_SPEED);

    shuffleIntervals.current.push(interval);
  };

  // Reveal letters one at a time (random order)
  const revealLetters = () => {
    const indices = Array.from({ length: letters.length }, (_, i) => i);
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
            if (newSet.size === letters.length && phase === 'halcyon') {
              // Pause for 1 second, then fade out
              setTimeout(() => {
                setPhase('fadeout');
                // Start fade out animation
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: FADE_OUT_DURATION,
                  useNativeDriver: true,
                }).start(() => {
                  // After fade out, complete and navigate
                  setPhase('complete');
                  onComplete();
                });
              }, PAUSE_AFTER_HALCYON);
            }
            
            return newSet;
          });
        });
      }, i * REVEAL_DELAY);
    });
  };

  // Start animation when phase is halcyon
  useEffect(() => {
    // Don't start animation during fadeout or complete
    if (phase !== 'halcyon') {
      return;
    }

    // Clear any existing intervals
    shuffleIntervals.current.forEach(interval => clearInterval(interval));
    shuffleIntervals.current = [];
    setRevealedIndices(new Set());
    
    // Initialize display characters
    setDisplayChars(letters.map(() => getRandomChar()));
    
    // Start revealing letters after a brief delay
    const timer = setTimeout(() => {
      revealLetters();
    }, 100);

    return () => {
      clearTimeout(timer);
      shuffleIntervals.current.forEach(interval => clearInterval(interval));
    };
  }, [phase]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    blackOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
      opacity: 0,
    },
    textContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    letter: {
      ...theme.typography.h1,
      fontSize: 48,
      fontWeight: '700',
      color: theme.colors.foreground,
      letterSpacing: 4,
      minWidth: 32,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.textContainer,
          { opacity: fadeAnim }
        ]}
      >
        {letters.map((letter, index) => (
          <Text key={`${phase}-${index}`} style={styles.letter}>
            {(phase === 'fadeout' || revealedIndices.has(index)) ? letter : (displayChars[index] || getRandomChar())}
          </Text>
        ))}
      </Animated.View>
      <Animated.View 
        style={[
          styles.blackOverlay,
          { opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            })
          }
        ]}
      />
    </View>
  );
}

