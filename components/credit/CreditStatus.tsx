"use client";

import React, { useState } from 'react';
import { Button } from '@mantine/core';
import CreditIndicator from './CreditIndicator';
import CreditHistoryModal from './CreditHistoryModal';
import CreditPurchaseModal from './CreditPurchaseModal';

const CreditStatus: React.FC = () => {
  const [historyModalOpened, setHistoryModalOpened] = useState(false);
  const [purchaseModalOpened, setPurchaseModalOpened] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <CreditIndicator />
      
      <Button 
        variant="subtle" 
        size="xs" 
        onClick={() => setHistoryModalOpened(true)}
        className="text-gray-600"
      >
        Lịch sử
      </Button>
      
      <Button 
        variant="light" 
        size="xs" 
        onClick={() => setPurchaseModalOpened(true)}
        color="green"
      >
        Mua Credit
      </Button>
      
      <CreditHistoryModal 
        opened={historyModalOpened} 
        onClose={() => setHistoryModalOpened(false)} 
      />
      
      <CreditPurchaseModal 
        opened={purchaseModalOpened} 
        onClose={() => setPurchaseModalOpened(false)} 
        onPurchaseComplete={() => {
          // Refresh thông tin credit nếu cần
        }}
      />
    </div>
  );
};

export default CreditStatus;
