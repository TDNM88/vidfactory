"use client";

import React, { useEffect, useState } from 'react';
import { Tooltip } from '@mantine/core';

interface CreditIndicatorProps {
  className?: string;
}

const CreditIndicator: React.FC<CreditIndicatorProps> = ({ className }) => {
  const [credit, setCredit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCreditInfo = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        const response = await fetch('/api/credits/info', {
          // Đảm bảo không cache kết quả
          cache: 'no-store'
        });
        
        if (!response.ok) {
          // Nếu lỗi 401 (Unauthorized), chỉ đặt credit = 0 mà không hiển thị lỗi
          if (response.status === 401) {
            if (isMounted) {
              setCredit(0);
              setError(null);
            }
            return;
          }
          
          throw new Error('Failed to fetch credit information');
        }
        
        const data = await response.json();
        
        if (data.success && isMounted) {
          setCredit(data.balance);
          setError(null);
        } else if (isMounted) {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Error fetching credit info:', err);
        if (isMounted) {
          // Đặt giá trị mặc định nếu có lỗi, để tránh hiển thị thông báo lỗi
          setCredit(0); 
          setError(null); // Không hiển thị lỗi cho người dùng
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCreditInfo();
    
    // Tạo interval để cập nhật credit mỗi 60 giây
    const intervalId = setInterval(fetchCreditInfo, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Hiển thị trạng thái loading
  if (loading && credit === null) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
        <span>Loading...</span>
      </div>
    );
  }

  // Hiển thị trạng thái lỗi
  if (error) {
    return (
      <Tooltip label={`Error: ${error}`}>
        <div className={`flex items-center text-red-500 ${className}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Credit Error</span>
        </div>
      </Tooltip>
    );
  }

  // Hiển thị giá trị credit
  return (
    <Tooltip label="Your current credit balance">
      <div className={`flex items-center ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{credit ?? 0} credits</span>
      </div>
    </Tooltip>
  );
};

export default CreditIndicator;
