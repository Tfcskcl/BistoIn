
import React from 'react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", iconSize = 28, light = false }) => {
  // Brand Colors
  const baseColor = light ? '#ffffff' : '#0f172a'; // White or Slate-900 (Structure)
  const accentColor = '#10b981'; // Emerald-500 (Intelligence/Growth)
  const secondaryColor = light ? '#94a3b8' : '#64748b'; // Slate-400 or Slate-500 (Subtext)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* The Data-Point Fork Icon */}
        <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* The Fork Base (Structure) */}
            <path 
                d="M11 17V21C11 26 15 29 20 29C25 29 29 26 29 21V17" 
                stroke={baseColor} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
            
            {/* The Handle */}
            <path 
                d="M20 29V36" 
                stroke={baseColor} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
            />

            {/* The Intelligence Nodes (Data Points replacing Tines) */}
            {/* Left Node */}
            <circle cx="11" cy="11" r="3" fill={accentColor} />
            
            {/* Middle Node (Higher = Growth) */}
            <circle cx="20" cy="7" r="3" fill={accentColor} />
            
            {/* Right Node */}
            <circle cx="29" cy="11" r="3" fill={accentColor} />
        </svg>
      </div>
      
      <div className="flex flex-col justify-center">
        <h1 className="font-bold tracking-tight leading-none flex items-center gap-0.5" style={{ fontSize: iconSize * 0.75, color: baseColor }}>
          Bistro<span style={{ color: accentColor }}>Connect</span>
        </h1>
        {iconSize > 20 && (
            <p className="text-[9px] font-medium tracking-[0.25em] uppercase opacity-80" style={{ color: secondaryColor }}>
                Intelligence
            </p>
        )}
      </div>
    </div>
  );
};
