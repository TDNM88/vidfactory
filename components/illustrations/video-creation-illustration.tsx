"use client";

import React from 'react';

export const VideoCreationIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full"
      >
        {/* Camera body */}
        <rect x="40" y="70" width="100" height="60" rx="5" fill="#4F46E5" />
        
        {/* Camera lens */}
        <circle cx="90" cy="100" r="25" fill="#1E1B4B" stroke="#6366F1" strokeWidth="3" />
        <circle cx="90" cy="100" r="15" fill="#312E81" />
        <circle cx="90" cy="100" r="8" fill="#1E1B4B" />
        
        {/* Record button */}
        <circle cx="150" cy="85" r="8" fill="#EF4444" />
        
        {/* Film strip */}
        <rect x="30" y="140" width="140" height="20" fill="#6366F1" />
        <rect x="40" y="140" width="10" height="20" fill="#312E81" />
        <rect x="60" y="140" width="10" height="20" fill="#312E81" />
        <rect x="80" y="140" width="10" height="20" fill="#312E81" />
        <rect x="100" y="140" width="10" height="20" fill="#312E81" />
        <rect x="120" y="140" width="10" height="20" fill="#312E81" />
        <rect x="140" y="140" width="10" height="20" fill="#312E81" />
        
        {/* Video icon */}
        <path
          d="M160 80L180 65V115L160 100V80Z"
          fill="#6366F1"
          stroke="#4F46E5"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};
