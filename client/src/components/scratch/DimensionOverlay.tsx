import React, { useState, useEffect } from "react";

interface ElementInfo {
  id: string;
  name: string;
  ref: React.RefObject<HTMLElement>;
  dimensions?: {
    width: number;
    height: number;
    padding?: { top: number; right: number; bottom: number; left: number };
    margin?: { top: number; right: number; bottom: number; left: number };
  };
}

interface DimensionOverlayProps {
  elements: ElementInfo[];
}

export default function DimensionOverlay({ elements }: DimensionOverlayProps) {
  const [dimensions, setDimensions] = useState<Map<string, DOMRect>>(new Map());

  useEffect(() => {
    const updateDimensions = () => {
      const newDimensions = new Map<string, DOMRect>();
      elements.forEach((el) => {
        if (el.ref.current) {
          const rect = el.ref.current.getBoundingClientRect();
          newDimensions.set(el.id, rect);
        }
      });
      setDimensions(newDimensions);
    };

    updateDimensions();
    // Reduced interval frequency to prevent excessive updates (100ms -> 500ms)
    const interval = setInterval(updateDimensions, 500);
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("scroll", updateDimensions, true);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("scroll", updateDimensions, true);
    };
  }, [elements]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {elements.map((el) => {
        const rect = dimensions.get(el.id);
        if (!rect || !el.dimensions) return null;

        return (
          <div
            key={el.id}
            className="absolute pointer-events-none"
            style={{
              left: `${rect.left}px`,
              top: `${rect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          >
            {/* Dimension Labels */}
            <div className="absolute -top-7 left-0 text-xs font-mono bg-blue-600 text-white px-2 py-1 rounded shadow-lg">
              W: {el.dimensions.width.toFixed(0)}px
            </div>
            <div className="absolute -left-20 top-0 text-xs font-mono bg-blue-600 text-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
              H: {el.dimensions.height.toFixed(0)}px
            </div>
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-3 h-3 border-2 border-blue-600 bg-blue-100"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-2 border-blue-600 bg-blue-100"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-2 border-blue-600 bg-blue-100"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-blue-600 bg-blue-100"></div>
          </div>
        );
      })}
    </div>
  );
}

