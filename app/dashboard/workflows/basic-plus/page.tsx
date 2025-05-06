"use client";
import { useState } from "react";
import DashboardWorkflowBasicPlus from '@/components/dashboardworkflow-basic-plus'
import BasicPlusWelcome from "@/components/basic-plus-welcome"; 
import { motion } from 'framer-motion';
import { Script } from "@/components/useStoryboardWorkflow";

// Dummy data and handlers for required props
const DUMMY_SCRIPT: Script = {
  title: "Kịch bản mẫu",
  segments: [
    { script: "Đây là phân đoạn 1" },
    { script: "Đây là phân đoạn 2" }
  ]
};
const DUMMY_VOICE_OPTIONS = [
  { fileName: "voice1.mp3", displayName: "Voice 1" },
  { fileName: "voice2.mp3", displayName: "Voice 2" }
];

export default function BasicPlusWorkflowPage() {
  const [showForm, setShowForm] = useState(false);
  // State for script, voice options, and api type (should be replaced with real logic)
  const [script, setScript] = useState(DUMMY_SCRIPT);
  const [voiceOptions] = useState(DUMMY_VOICE_OPTIONS);
  const [voiceApiType] = useState<'f5-tts' | 'vixtts'>('f5-tts');

  // Dummy handlers (replace with real logic)
  const onVoiceChange = (idx: number, voiceName: string) => {};
  const onGenerateVoiceForSegment = async (idx: number, voiceApiType: 'f5-tts' | 'vixtts') => {};
  const onEditImageDesc = (idx: number, desc: string) => {};
  const onGenerateImageForSegment = async (idx: number, style: 'realistic' | 'anime') => {};
  const onConfirm = () => {};
  const onCreateSegmentVideo = (idx: number, type: 'basic' | 'premium' | 'super') => {};
  const onAddSegment = (insertIdx: number) => {};
  const onRemoveSegment = (removeIdx: number) => {};

  return showForm ? (
    <DashboardWorkflowBasicPlus
      script={script}
      voiceOptions={voiceOptions}
      voiceApiType={voiceApiType}
      onVoiceChange={onVoiceChange}
      onGenerateVoiceForSegment={onGenerateVoiceForSegment}
      onEditImageDesc={onEditImageDesc}
      onGenerateImageForSegment={onGenerateImageForSegment}
      onConfirm={onConfirm}
      onCreateSegmentVideo={onCreateSegmentVideo}
      onAddSegment={onAddSegment}
      onRemoveSegment={onRemoveSegment}
    />
  ) : (
    <BasicPlusWelcome onStart={() => setShowForm(true)} />
  );
}
