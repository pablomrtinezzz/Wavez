'use client';

import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 bg-cyan-500/20 rounded-xl blur-md"
        style={{ width: size, height: size }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          <linearGradient id="wavezGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="crestGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#67E8F9" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Squircle Base */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="#0B192C"
          stroke="rgba(6, 182, 212, 0.4)"
          strokeWidth="1.5"
        />

        {/* Sonar / Radar rings */}
        <circle cx="24" cy="24" r="16" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="24" cy="24" r="10" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" strokeDasharray="2 3" />

        {/* Dynamic Surf Wave Crest / W Shape */}
        <path
          d="M12 28 C15 28 17 22 20 20 C22 18 24 22 26 25 C28 28 31 16 36 17"
          stroke="url(#wavezGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Barrel / Tube Curl accent */}
        <path
          d="M28 17 C32 15 36 17 36 21 C36 25 32 26 29 24"
          stroke="url(#crestGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Glowing Radar Target Dot */}
        <circle cx="20" cy="20" r="2.5" fill="#34D399" />
        <circle cx="20" cy="20" r="4.5" stroke="#34D399" strokeWidth="1" opacity="0.5" className="animate-ping" />
      </svg>
    </div>
  );
};
