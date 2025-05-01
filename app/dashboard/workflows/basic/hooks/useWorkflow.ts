import { useState } from 'react';
import { WorkflowTypes } from '@/types/workflows';

export const useBasicWorkflow = () => {
  const [state, setState] = useState<WorkflowTypes.Basic['State']>({
    segments: [],
    processing: false
  });

  const processSegment = async (segment: WorkflowTypes.Basic['Segment']) => {
    setState((prev: WorkflowTypes.Basic['State']) => ({ ...prev, processing: true }));
    try {
      // Gọi API xử lý segment
      const response = await fetch('/api/workflows/basic/create-video', {
        method: 'POST',
        body: JSON.stringify(segment)
      });
      // ... xử lý response ...
    } finally {
      setState((prev: WorkflowTypes.Basic['State']) => ({ ...prev, processing: false }));
    }
  };

  return { state, processSegment };
}; 