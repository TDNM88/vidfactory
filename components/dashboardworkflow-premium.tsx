// dashboardworkflow-premium.tsx
import React from 'react';
import DashboardWorkflowUnified from './DashboardWorkflowUnified';
import { VoiceOption, Script } from './useStoryboardWorkflow';

interface DashboardWorkflowPremiumProps {
  script?: Script;
  voiceOptions: VoiceOption[];
  voiceApiType: 'vixtts';
  onVoiceChange: (idx: number, voiceName: string) => void;
  onGenerateVoiceForSegment: (idx: number, voiceApiType?: 'vixtts') => Promise<void>;
  onEditImageDesc: (idx: number, desc: string) => void;
  onGenerateImageForSegment: (idx: number, style: 'realistic' | 'anime') => Promise<void>;
  onConfirm: () => void;
  onCreateSegmentVideo?: (idx: number, type: 'basic' | 'premium' | 'super') => void;
  onAddSegment?: (insertIdx: number) => void;
  onRemoveSegment?: (removeIdx: number) => void;
}

export default function DashboardWorkflowPremium(props: DashboardWorkflowPremiumProps) {
  return <DashboardWorkflowUnified {...props} branding="premium" />;
}
