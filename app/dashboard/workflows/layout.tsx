'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { WorkflowSwitcher } from '@/components/WorkflowSwitcher';

export default function WorkflowLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="workflow-container p-4">
      <WorkflowSwitcher />
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
} 