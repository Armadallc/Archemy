/**
 * HALCYON Design System - Utility Functions
 * 
 * Common utility functions for the design system components.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}







