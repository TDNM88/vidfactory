"use client";

import React, { useEffect, useState } from 'react';
import { Button, Tooltip } from '@mantine/core';

interface CreditCostButtonProps {
  apiName: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'filled' | 'outline' | 'light' | 'white' | 'default' | 'subtle' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const CreditCostButton: React.FC<CreditCostButtonProps> = ({
  apiName,
  onClick,
  disabled = false,
  children,
  className = '',
  variant = 'filled',
  size = 'md',
  color = 'blue',
}) => {
  const [costInfo, setCostInfo] = useState<{
    creditCost: number;
    displayName: string;
    canAfford: boolean;
    userCredit: number;
    isBasicFree: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCostInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/credits/cost?apiName=${encodeURIComponent(apiName)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch API cost information');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCostInfo({
            creditCost: data.creditCost,
            displayName: data.displayName || apiName,
            canAfford: data.canAfford,
            userCredit: data.userCredit,
            isBasicFree: data.isBasicFree,
          });
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Error fetching API cost info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCostInfo();
  }, [apiName]);

  // Tính toán trạng thái nút
  const isButtonDisabled = disabled || (costInfo && !costInfo.canAfford && !costInfo.isBasicFree) || loading;
  
  // Tạo nội dung tooltip
  const getTooltipContent = () => {
    if (loading) {
      return 'Loading cost information...';
    }
    
    if (error) {
      return `Error: ${error}`;
    }
    
    if (!costInfo) {
      return 'Cost information unavailable';
    }
    
    if (costInfo.isBasicFree) {
      return `${costInfo.displayName} - No credits required (Free for Basic)`;
    }
    
    if (!costInfo.canAfford) {
      return `${costInfo.displayName} - Requires ${costInfo.creditCost} credits. You only have ${costInfo.userCredit} credits.`;
    }
    
    return `${costInfo.displayName} - ${costInfo.creditCost} credits`;
  };

  return (
    <Tooltip label={getTooltipContent()} position="top" withArrow>
      <div className="inline-block">
        <Button
          onClick={onClick}
          disabled={isButtonDisabled}
          className={className}
          variant={variant}
          size={size}
          color={color}
        >
          <div className="flex items-center gap-2">
            {children}
            {costInfo && !costInfo.isBasicFree && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{costInfo.creditCost}</span>
              </div>
            )}
            {loading && (
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin ml-2"></div>
            )}
          </div>
        </Button>
      </div>
    </Tooltip>
  );
};

export default CreditCostButton;
