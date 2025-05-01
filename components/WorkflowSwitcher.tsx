import { useState } from 'react';
import BasicWorkflow from '@/app/dashboard/workflows/basic/BasicWorkflow';
import PremiumWorkflow from '@/app/dashboard/workflows/premium/PremiumWorkflow';

export const WorkflowSwitcher = () => {
  const [currentWorkflow, setWorkflow] = useState<'basic' | 'premium' | 'super'>('basic');

  return (
    <div className="workflow-switcher space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setWorkflow('basic')}
          className={`px-4 py-2 rounded-lg ${
            currentWorkflow === 'basic' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Basic
        </button>
        <button
          onClick={() => setWorkflow('premium')}
          className={`px-4 py-2 rounded-lg ${
            currentWorkflow === 'premium'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Premium
        </button>
      </div>

      {currentWorkflow === 'basic' && <BasicWorkflow />}
      {currentWorkflow === 'premium' && <PremiumWorkflow />}
    </div>
  );
}; 