import React from 'react';

export default function AppLogo({ className = "w-8 h-8" }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* The Crescent Moon */}
      {/* Tapered elegant sweep, now thicker (more girth) */}
      <path 
        d="M 45 95 C 10 95 0 65 0 45 C 0 20 12 5 32 0 C 22 10 14 25 14 45 C 14 66 32 80 54 80 C 68 80 80 72 88 56 C 78 82 62 95 45 95 Z" 
        className="fill-primary drop-shadow-md"
      />
      
      {/* Outer Geometric Frame (Green) */}
      <path 
        d="M 60 16 L 86 34 L 86 72 L 74 72 L 74 44 L 60 34 L 46 44 L 46 72 L 34 72 L 34 34 Z" 
        className="fill-primary stroke-background"
        strokeWidth="3.5"
        strokeLinejoin="miter"
      />
      
      {/* Inner Geometric Wings (Green) */}
      <path 
        d="M 60 30 L 77 42 L 77 72 L 67 72 L 67 50 L 60 45 L 53 50 L 53 72 L 43 72 L 43 42 Z" 
        className="fill-primary stroke-background"
        strokeWidth="3"
        strokeLinejoin="miter"
      />

      {/* Core Geometric Center (Gold) */}
      <path 
        d="M 60 42 L 71 50 L 71 72 L 49 72 L 49 50 Z" 
        fill="#D4AF37"
        className="stroke-background"
        strokeWidth="3"
        strokeLinejoin="miter"
      />

      {/* Arch Doorway Cutout */}
      <path 
        d="M 60 55 L 66 60 L 66 72 L 54 72 L 54 60 Z" 
        className="fill-background"
      />
    </svg>
  );
}
