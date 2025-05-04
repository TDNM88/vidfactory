"use client";

import React, { useState } from 'react';
import { Tooltip } from '@mantine/core';
import { useUserStatus } from '../UserStatusContext';

interface CreditIndicatorProps {
  className?: string;
}

const CreditIndicator: React.FC<CreditIndicatorProps> = ({ className }) => {
  const { user, loading } = useUserStatus();
  const [error, setError] = useState<string | null>(null);

  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium animate-pulse">Loading...</span>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <Tooltip label={error} position="bottom" withArrow>
        <div className={`flex items-center ${className}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{user?.credit || 0} credits</span>
        </div>
      </Tooltip>
    );
  }

  // Hiển thị credit
  return (
    <div className={`flex items-center ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-medium">{user?.credit || 0} credits</span>
    </div>
  );
};

export default CreditIndicator;
