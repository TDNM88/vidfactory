import { useState } from 'react';
import { toast } from 'react-hot-toast';

export interface Segment {
  script: string;
  image_description?: string;
  direct_image_url?: string;
  voice_url?: string;
  voiceName?: string;
  // Basic có thể có thêm các trường phụ như image_path, image_base64, ...
  [key: string]: any;
}

export interface Script {
  title: string;
  segments: Segment[];
  platform?: string;
  platform_width?: number;
  platform_height?: number;
  [key: string]: any;
}

export interface VoiceOption {
  fileName: string;
  displayName: string;
}

export interface StoryboardWorkflowConfig {
  viduApiKey?: string;
  // Có thể mở rộng thêm config đặc thù từng workflow
}

export function useStoryboardWorkflow({
  script,
  setScript,
  config = {},
}: {
  script?: Script;
  setScript: (script: Script) => void;
  config?: StoryboardWorkflowConfig;
}) {
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: { image?: boolean; voice?: boolean; video?: boolean } }>({});
  const [videoUrls, setVideoUrls] = useState<{ [key: number]: string }>({});

  // Hàm xử lý tạo ảnh với loading state
  const handleGenerateImage = async (idx: number, style: 'realistic' | 'anime', onGenerateImageForSegment: (idx: number, style: 'realistic' | 'anime') => Promise<void>) => {
    setLoadingStates((prev) => ({ ...prev, [idx]: { ...prev[idx], image: true } }));
    try {
      await onGenerateImageForSegment(idx, style);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo ảnh ${style} cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [idx]: { ...prev[idx], image: false } }));
    }
  };

  // Hàm xử lý tạo giọng với loading state
  const handleGenerateVoice = async (idx: number, apiType: 'f5-tts' | 'vixtts', onGenerateVoiceForSegment: (idx: number, apiType: 'f5-tts' | 'vixtts') => Promise<void>) => {
    setLoadingStates((prev) => ({ ...prev, [idx]: { ...prev[idx], voice: true } }));
    try {
      await onGenerateVoiceForSegment(idx, apiType);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo giọng ${apiType} cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [idx]: { ...prev[idx], voice: false } }));
    }
  };

  // Hàm kiểm tra trạng thái task Vidu
  const checkViduTaskStatus = async (taskId: string, apiKey: string, timeout = 300000, pollInterval = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const res = await fetch(`https://api.vidu.com/ent/v2/tasks/${taskId}/creations`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await res.json();
        const state = result.state;
        const creations = result.creations || [];
        if (state === 'success' && creations.length > 0 && creations[0].url) {
          return { success: true, videoUrl: creations[0].url };
        } else if (state === 'failed') {
          return { success: false, error: result.err_code || 'Tác vụ Vidu thất bại.' };
        }
        // Nếu chưa xong, chờ tiếp
        await new Promise(r => setTimeout(r, pollInterval));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: 'Lỗi khi kiểm tra trạng thái task: ' + errorMsg };
      }
    }
    return { success: false, error: 'Hết thời gian chờ tạo video.' };
  };

  // Hàm xử lý tạo video với loading state
  const handleCreateVideo = async (
    idx: number,
    getImageUrl: (idx: number) => string | undefined,
    uploadToVidu: (imgBlob: Blob, idx: number) => Promise<{ uri: string }>,
    onVideoCreated?: (videoUrl: string) => void
  ) => {
    setLoadingStates((prev) => ({ ...prev, [idx]: { ...prev[idx], video: true } }));
    try {
      const imageUrl = getImageUrl(idx);
      if (!imageUrl) {
        toast.error('Phân đoạn chưa có ảnh minh họa!');
        return;
      }
      let imgRes;
      try {
        imgRes = await fetch(imageUrl);
      } catch (fetchErr) {
        toast.error('Không fetch được ảnh từ URL: ' + imageUrl);
        return;
      }
      if (!imgRes || !imgRes.ok) {
        toast.error('Ảnh không tồn tại hoặc không truy cập được: ' + imageUrl);
        return;
      }
      const imgBlob = await imgRes.blob();
      // Upload ảnh qua backend để lấy uri
      const uploadData = await uploadToVidu(imgBlob, idx);
      if (!uploadData.uri) {
        toast.error('Lỗi upload ảnh lên backend');
        return;
      }
      // Gọi API tạo video với uri ảnh
      const viduApiKey = config.viduApiKey || process.env.NEXT_PUBLIC_VIDU_API_KEY || '';
      if (!viduApiKey) {
        toast.error('Chưa cấu hình API key cho Vidu!');
        return;
      }
      const videoRes = await fetch('https://api.vidu.com/ent/v2/img2video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${viduApiKey}`,
        },
        body: JSON.stringify({
          model: 'vidu2.0',
          images: [uploadData.uri],
          prompt: script?.segments[idx]?.script || '',
          duration: 4,
          resolution: '720p',
          movement_amplitude: 'auto',
        }),
      });
      let videoData;
      try {
        videoData = await videoRes.json();
      } catch (e) {
        toast.error('Lỗi không đọc được phản hồi tạo video');
        return;
      }
      if (!videoRes.ok || !videoData.task_id) {
        toast.error(videoData?.message || 'Lỗi khi gửi yêu cầu tạo video');
        return;
      }
      toast.success('Đã gửi yêu cầu tạo video! Đang chờ kết quả...');
      // Tự động kiểm tra trạng thái task
      const status = await checkViduTaskStatus(videoData.task_id, viduApiKey);
      if (status.success) {
        toast.success('Tạo video thành công!');
        setVideoUrls((prev) => ({ ...prev, [idx]: status.videoUrl }));
        if (onVideoCreated) onVideoCreated(status.videoUrl);
      } else {
        toast.error(status.error || 'Tạo video thất bại!');
      }
    } catch (err: any) {
      toast.error(err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Lỗi khi tạo video!');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [idx]: { ...prev[idx], video: false } }));
    }
  };

  return {
    loadingStates,
    videoUrls,
    handleGenerateImage,
    handleGenerateVoice,
    handleCreateVideo,
    setVideoUrls,
    setLoadingStates,
  };
}
