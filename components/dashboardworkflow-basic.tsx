import React from 'react';
import DashboardWorkflowUnified from './DashboardWorkflowUnified';
import { VoiceOption, Script } from './useStoryboardWorkflow';

// Định nghĩa kiểu dữ liệu cho props
interface DashboardWorkflowBasicProps {
  script?: Script;
  voiceOptions: VoiceOption[];
  voiceApiType: 'f5-tts' | 'vixtts';
  onVoiceChange: (idx: number, voiceName: string) => void;
  onGenerateVoiceForSegment: (idx: number, voiceApiType: 'f5-tts' | 'vixtts') => Promise<void>;
  onEditImageDesc: (idx: number, desc: string) => void;
  onGenerateImageForSegment: (idx: number, style: 'realistic' | 'anime') => Promise<void>;
  onConfirm: () => void;
  onCreateSegmentVideo?: (idx: number, type: 'basic' | 'premium' | 'super') => void;
  onAddSegment?: (insertIdx: number) => void;
  onRemoveSegment?: (removeIdx: number) => void;
}

export default function DashboardWorkflowBasicUnifiedWrapper(props: DashboardWorkflowBasicProps) {
  return <DashboardWorkflowUnified {...props} branding="basic" />;
}