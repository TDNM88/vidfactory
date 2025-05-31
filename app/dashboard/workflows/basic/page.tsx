"use client";
import { useState } from "react";
import DashboardWorkflowBasic from "@/components/dashboardworkflow-basic";
import BasicWelcome from "@/components/basic-welcome";
import { Script, VoiceOption } from "@/components/useStoryboardWorkflow";

export default function BasicWorkflowPage() {
  const [showForm, setShowForm] = useState(false);
  const [script, setScript] = useState<Script | undefined>(undefined);
  
  // Sử dụng giọng đọc mẫu từ thư mục public\voices để gửi đến API tạo giọng đọc
  const sampleVoiceOptions: VoiceOption[] = [
    { fileName: 'Mai An.wav', displayName: 'Mai An (Nữ)' },
    { fileName: 'Phan Linh.wav', displayName: 'Phan Linh (Nữ)' },
    { fileName: 'Trường Giang.wav', displayName: 'Trường Giang (Nam)' },
  ];
  
  const handleVoiceChange = (idx: number, voiceName: string) => {
    console.log(`Thay đổi giọng đọc cho phân đoạn ${idx} thành ${voiceName}`);
  };
  
  const handleGenerateVoiceForSegment = async (idx: number, voiceApiType: 'vixtts' = 'vixtts') => {
    if (!script || !script.segments[idx]) {
      throw new Error('Không tìm thấy phân đoạn');
    }
    
    const segment = script.segments[idx];
    if (!segment.script) {
      throw new Error('Phân đoạn không có nội dung văn bản');
    }
    
    if (!segment.voiceName) {
      throw new Error('Vui lòng chọn giọng đọc trước khi tạo');
    }
    
    try {
      // Lấy token xác thực từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập hoặc phiên đã hết hạn');
      }
      
      // Gọi API tạo giọng đọc
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: segment.script,
          segmentIdx: idx,
          voiceName: segment.voiceName,
          voiceApiType: voiceApiType,
          language: 'vi',
          normalizeText: true,
          speed: 1.0
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.voice_url) {
        // Cập nhật voice_url cho phân đoạn
        const updatedSegments = [...script.segments];
        updatedSegments[idx] = {
          ...updatedSegments[idx],
          voice_url: data.voice_url
        };
        
        setScript({
          ...script,
          segments: updatedSegments
        });
        
        console.log(`Đã tạo giọng đọc thành công cho phân đoạn ${idx + 1}`);
      } else {
        throw new Error(data.error || 'Không nhận được URL giọng đọc');
      }
    } catch (error) {
      console.error(`Lỗi khi tạo giọng đọc cho phân đoạn ${idx}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Không thể tạo giọng đọc');
    }
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
      voiceOptions={sampleVoiceOptions}
      voiceApiType="vixtts"
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
