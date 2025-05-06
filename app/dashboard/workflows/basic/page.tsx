"use client";
import { useState } from "react";
import DashboardWorkflowBasic from "@/components/dashboardworkflow-basic";
import BasicWelcome from "@/components/basic-welcome";
import { Script, VoiceOption } from "@/components/useStoryboardWorkflow";

export default function BasicWorkflowPage() {
  const [showForm, setShowForm] = useState(false);
  const [script, setScript] = useState<Script | undefined>(undefined);
  
  // Mock data và hàm xử lý cho DashboardWorkflowBasic
  const voiceOptions: VoiceOption[] = [
    { fileName: 'female1.mp3', displayName: 'Nữ 1' },
    { fileName: 'female2.mp3', displayName: 'Nữ 2' },
    { fileName: 'male1.mp3', displayName: 'Nam 1' },
    { fileName: 'male2.mp3', displayName: 'Nam 2' },
  ];
  
  const handleVoiceChange = (idx: number, voiceName: string) => {
    console.log(`Thay đổi giọng đọc cho phân đoạn ${idx} thành ${voiceName}`);
  };
  
  const handleGenerateVoiceForSegment = async (idx: number, voiceApiType: 'f5-tts' | 'vixtts') => {
    console.log(`Tạo giọng đọc cho phân đoạn ${idx} với API ${voiceApiType}`);
  };
  
  const handleEditImageDesc = (idx: number, desc: string) => {
    console.log(`Cập nhật mô tả ảnh cho phân đoạn ${idx}: ${desc}`);
  };
  
  const handleGenerateImageForSegment = async (idx: number, style: 'realistic' | 'anime') => {
    console.log(`Tạo ảnh cho phân đoạn ${idx} với phong cách ${style}`);
  };
  
  const handleConfirm = () => {
    console.log('Xác nhận hoàn thành');
  };
  
  const handleCreateSegmentVideo = (idx: number, type: 'basic' | 'premium' | 'super') => {
    console.log(`Tạo video cho phân đoạn ${idx} với loại ${type}`);
  };
  
  return showForm ? (
    <DashboardWorkflowBasic 
      script={script}
      voiceOptions={voiceOptions}
      voiceApiType="f5-tts"
      onVoiceChange={handleVoiceChange}
      onGenerateVoiceForSegment={handleGenerateVoiceForSegment}
      onEditImageDesc={handleEditImageDesc}
      onGenerateImageForSegment={handleGenerateImageForSegment}
      onConfirm={handleConfirm}
      onCreateSegmentVideo={handleCreateSegmentVideo}
    />
  ) : (
    <BasicWelcome onStart={() => setShowForm(true)} />
  );
}
