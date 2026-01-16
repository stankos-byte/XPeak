import React from 'react';

interface HalftoneDotsProps {
  className?: string;
  color?: string;
  size?: string;
  opacity?: number;
  fadeDirection?: "radial" | "bottom" | "top" | "left" | "right" | "none";
}

export const HalftoneDots = ({ 
  className = "", 
  color = "#3b82f6", 
  size = "24px", 
  opacity = 0.15,
  fadeDirection = "radial" 
}: HalftoneDotsProps) => {
  const mask = fadeDirection === "radial" 
    ? "radial-gradient(circle at center, black 0%, transparent 35%)" 
    : fadeDirection === "bottom" 
    ? "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)"
    : fadeDirection === "top"
    ? "linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%)"
    : fadeDirection === "left"
    ? "linear-gradient(to left, transparent 0%, black 15%, black 85%, transparent 100%)"
    : fadeDirection === "right"
    ? "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)"
    : "none";

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle, ${color} 1.5px, transparent 1.5px)`,
        backgroundSize: `${size} ${size}`,
        opacity: opacity,
        WebkitMaskImage: mask,
        maskImage: mask
      }}
    />
  );
};
