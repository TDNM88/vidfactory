import { useState } from 'react';

export const useViduWorkflow = () => {
  const [viduState, setViduState] = useState({
    processing: false,
    videoUrl: ''
  });

  const generateVideo = async () => {
    setViduState(prev => ({ ...prev, processing: true }));
    try {
      // Gọi API Premium
      const response = await fetch('/api/workflows/premium/create-video', {
        method: 'POST'
      });
      // ... xử lý response ...
    } finally {
      setViduState(prev => ({ ...prev, processing: false }));
    }
  };

  return { viduState, generateVideo };
}; 