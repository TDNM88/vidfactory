import React, { useState, useEffect, useCallback } from 'react';
import { useCreditAutoRefresh } from './useCreditAutoRefresh';
import StoryboardTable from './StoryboardTable';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { ImageIcon, Mic, Video, Loader2, Edit2, Save, Play, Info } from 'lucide-react';
import debounce from 'lodash/debounce';
import Modal from 'react-modal';
import { toAbsoluteUrl } from '../lib/toAbsoluteUrl';
import type { BasicVideoRequest } from './types';

// Validate style settings before generating script
function validateStyleSettings(styleSettings: { style: string; character: string; scene: string }): boolean {
  // Style is always required
  if (!styleSettings.style) {
    toast.error('Vui lòng chọn phong cách hình ảnh!');
    return false;
  }
  // For "flat lay", character is optional
  if (styleSettings.style !== 'flat lay' && !styleSettings.character) {
    toast.error('Vui lòng nhập mô tả nhân vật!');
    return false;
  }
  // Scene is always required
  if (!styleSettings.scene) {
    toast.error('Vui lòng nhập mô tả bối cảnh!');
    return false;
  }
  return true;
}

// Định nghĩa types
interface Segment {
  script: string;
  image_description?: string;
  direct_image_url?: string;
  image_path?: string;
  imageUrl?: string;
  image_base64?: string;
  voice_url?: string | undefined;
  voice_path?: string | undefined;
  video_path?: string;
  voiceName?: string;
}

interface Script {
  title: string;
  segments: Segment[];
  platform?: string;
  platform_width?: number;
  platform_height?: number;
}

interface StyleOption {
  value: string;
  label: string;
  description: string;
  characterPlaceholder: string;
  scenePlaceholder: string;
}

interface SessionData {
  subject: string;
  summary: string;
  platform: string;
  duration: string;
  script: Script;
  styleSettings: {
    style: string;
    character: string;
    scene: string;
  };
}

interface VideoResult {
  type: 'basic' | 'premium' | 'super';
  url: string;
}

interface VoiceOption {
  fileName: string;
  displayName: string;
}

const platformSizes: Record<string, { width: number; height: number }> = {
  TikTok: { width: 720, height: 1280 },
  YouTube: { width: 1280, height: 720 },
  Instagram: { width: 1080, height: 1080 },
};

const styleOptions: StyleOption[] = [
  {
    value: 'cinematic',
    label: 'Cinematic',
    description: 'Phong cách điện ảnh với ánh sáng mềm mại, màu sắc sống động.',
    characterPlaceholder: 'Ví dụ: Một cô gái 25 tuổi, áo trắng, nụ cười tự tin',
    scenePlaceholder: 'Ví dụ: Tông màu ấm, bối cảnh quán cà phê hoặc công viên',
  },
  {
    value: 'anime',
    label: 'Anime',
    description: 'Phong cách hoạt hình Nhật Bản với nhân vật và bối cảnh chi tiết.',
    characterPlaceholder: 'Ví dụ: Một chàng trai trẻ, tóc đen, mặc áo khoác học sinh',
    scenePlaceholder: 'Ví dụ: Thành phố hiện đại hoặc trường học với màu sắc tươi sáng',
  },
  {
    value: 'flat lay',
    label: 'Flat Lay',
    description: 'Phong cách sắp xếp đồ vật trên mặt phẳng, phù hợp cho sản phẩm.',
    characterPlaceholder: 'Thường không có nhân vật, để trống',
    scenePlaceholder: 'Ví dụ: Bàn gỗ với sách, cà phê, và hoa, tông màu pastel',
  },
  {
    value: 'realistic',
    label: 'Realistic',
    description: 'Hình ảnh chân thực, giống ảnh chụp thực tế.',
    characterPlaceholder: 'Ví dụ: Một người đàn ông trung niên, mặc vest, đứng trong văn phòng',
    scenePlaceholder: 'Ví dụ: Văn phòng hiện đại hoặc công viên xanh mát',
  },
];

const DashboardWorkflow = (): React.ReactElement => {   
  // State for sessionData
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to default
          return {
            subject: '',
            summary: '',
            platform: 'TikTok',
            duration: '60',
            script: { title: '', segments: [] },
            styleSettings: {
              style: 'cinematic',
              character: '',
              scene: '',
            }
          };
        }
      }
    }
    return {
      subject: '',
      summary: '',
      platform: 'TikTok',
      duration: '60',
      script: { title: '', segments: [] },
      styleSettings: {
        style: 'cinematic',
        character: '',
        scene: '',
      },
    };
  });

  // State hooks
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [videoResults, setVideoResults] = useState<VideoResult[][]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  const [backgroundMusic, setBackgroundMusic] = useState<string>('none');
  const [musicVolume, setMusicVolume] = useState<number>(0.2);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [modalVideo, setModalVideo] = useState<{ url: string; type: string } | null>(null);
  const [openSegments, setOpenSegments] = useState<boolean[]>([]);
  const [tempInputs, setTempInputs] = useState<{ [key: string]: string }>({});
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [voiceApiType, setVoiceApiType] = useState<'f5-tts' | 'vixtts'>('f5-tts');

  // Lưu sessionData vào localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
    }
  }, [sessionData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && document.body) {
      Modal.setAppElement(document.body);
    }
  }, []);

  useEffect(() => {
    setOpenSegments(new Array(sessionData.script.segments.length).fill(false));
  }, [sessionData.script.segments.length]);

  useEffect (() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch('/api/list-voices');
        const data = await res.json();
        if (data.success && data.voices) {
          const configRes = await fetch('/voices.json');
          const config = configRes.ok ? await configRes.json() : {};
          const options = data.voices.map((fileName: string) => ({
            fileName,
            displayName: config[fileName]?.displayName || fileName.replace(/\.(wav|mp3)$/i, ''),
          }));
          setVoiceOptions(options);
        } else {
          toast.error('Không thể tải danh sách giọng!');
        }
      } catch (err: any) {
        toast.error('Lỗi khi tải danh sách giọng!');
      }
    };
    fetchVoices();
  }, []);
  
  
  
  
  
  

  // ...

  

  const syncSegmentField = useCallback(
    debounce((idx: number, field: keyof Segment, value: string) => {
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = { ...newSegments[idx], [field]: value };
      setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
    }, 300),
    [sessionData.script.segments]
  );

  // --- HANDLERS: Only keep one version of each, all in one place, correct scope, correct types ---

  // Handle script generation
  const handleGenerateScript = async () => {
    if (!validateStyleSettings(sessionData.styleSettings)) {
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Đang tạo kịch bản...');
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: sessionData.subject,
          summary: sessionData.summary,
          platform: sessionData.platform,
          duration: sessionData.duration,
          styleSettings: sessionData.styleSettings,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.script) {
        throw new Error(data.error || 'Lỗi khi tạo kịch bản');
      }
      const newScript = {
        ...data.script,
        platform: sessionData.platform,
        platform_width: platformSizes[sessionData.platform].width,
        platform_height: platformSizes[sessionData.platform].height,
      };
      setSessionData((prev: SessionData) => ({ ...prev, script: newScript }));
      setVideoResults(new Array(data.script.segments.length).fill([]));
      setCurrentStep(2);
      toast.success('Đã tạo kịch bản thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo kịch bản!');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle editing a segment field
  const handleEditSegmentField = (idx: number, field: keyof Segment, value: string) => {
    const newSegments = [...sessionData.script.segments];
    newSegments[idx] = { ...newSegments[idx], [field]: value };
    setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
  };

  // Handle removing an image from a segment
  const handleRemoveImage = (idx: number) => {
    const newSegments = [...sessionData.script.segments];
    newSegments[idx] = {
      ...newSegments[idx],
      direct_image_url: undefined,
      imageUrl: undefined,
      image_base64: undefined,
      image_path: undefined,
    };
    setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
    toast.success('Đã xóa ảnh!');
  };

  // Handle uploading an image to a segment
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    setLoadingMessage('Đang upload ảnh...');
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success || !data.direct_image_url) {
        throw new Error(data.error || 'Lỗi khi upload ảnh');
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = {
        ...newSegments[idx],
        direct_image_url: toAbsoluteUrl(data.direct_image_url),
        image_path: data.image_path,
      };
      setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
      toast.success('Upload ảnh thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi upload ảnh!');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle generating an image for a segment (AI)
  const handleGenerateImageForSegment = async (idx: number) => {
    setIsLoading(true);
    setLoadingMessage('Đang tạo ảnh AI...');
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: sessionData.script.segments[idx].image_description,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.direct_image_url) {
        throw new Error(data.error || 'Lỗi khi tạo ảnh AI');
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = {
        ...newSegments[idx],
        direct_image_url: toAbsoluteUrl(data.direct_image_url),
        image_path: data.image_path,
      };
      setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
      toast.success(`Đã tạo ảnh cho phân đoạn ${idx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo ảnh AI!');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle generating voice for a segment
  const handleGenerateVoiceForSegment = async (idx: number, voiceApiType: 'f5-tts' | 'vixtts') => {
    setIsLoading(true);
    setLoadingMessage('Đang tạo giọng...');
    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: sessionData.script.segments[idx].script,
          voiceName: sessionData.script.segments[idx].voiceName,
          apiType: voiceApiType,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.voiceUrl) {
        throw new Error(data.error || 'Lỗi khi tạo giọng');
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = {
        ...newSegments[idx],
        voice_url: data.voiceUrl,
        voice_path: data.voice_path,
      };
      setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
      toast.success(`Đã tạo giọng (${voiceApiType === 'vixtts' ? 'VixTTS' : 'F5-TTS'}) cho phân đoạn ${idx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo giọng!');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle creating a video for a segment
  const handleCreateSegmentVideo = async (idx: number, type: 'basic' | 'premium' | 'super') => {
    setIsLoading(true);
    setLoadingMessage('Đang tạo video...');
    try {
      const res = await fetch('/api/create-segment-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment: sessionData.script.segments[idx],
          type,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.videoUrl) {
        throw new Error(data.error || 'Lỗi khi tạo video');
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = { ...newSegments[idx], video_path: data.videoUrl };
      setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
      setVideoResults((prev) => {
        const newResults = [...prev];
        if (!newResults[idx]) newResults[idx] = [];
        newResults[idx] = newResults[idx].filter((v) => v.type !== type);
        newResults[idx].push({ type, url: data.videoUrl });
        return newResults;
      });
      toast.success(`Tạo video ${type} cho phân đoạn ${idx + 1} thành công!`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo video!');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle creating all videos (batch)
  const handleCreateAllVideos = async () => {
    setIsLoading(true);
    setLoadingMessage('Đang tạo tất cả video...');
    try {
      const res = await fetch('/api/create-all-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: sessionData.script.segments,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.results) {
        throw new Error(data.error || 'Lỗi khi tạo tất cả video');
      }
      const newSegments = [...sessionData.script.segments];
      data.results.forEach((result: { idx: number; direct_image_url: string; image_path: string; videoUrl: string }) => {
        newSegments[result.idx] = {
          ...newSegments[result.idx],
          direct_image_url: toAbsoluteUrl(result.direct_image_url),
          image_path: result.image_path,
          video_path: result.videoUrl,
        };
      });
      setSessionData((prev: SessionData) => ({ ...prev, script: { ...prev.script, segments: newSegments } }));
      toast.success('Đã tạo tất cả video thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo tất cả video!');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle concatenating all videos into the final video
  const handleConcatVideos = async () => {
    setIsLoading(true);
    setLoadingMessage('Đang ghép video tổng...');
    try {
      const res = await fetch('/api/concat-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: sessionData.script.segments,
          backgroundMusic,
          musicVolume,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.videoUrl) {
        throw new Error(data.error || 'Lỗi khi ghép video tổng');
      }
      setFinalVideoUrl(data.videoUrl);
      toast.success('Ghép video tổng thành công!');
      setCurrentStep(4);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi ghép video tổng!');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle cleanup/reset
  const handleCleanup = () => {
    setSessionData({
      subject: '',
      summary: '',
      platform: 'TikTok',
      duration: '60',
      script: { title: '', segments: [] },
      styleSettings: {
        style: 'cinematic',
        character: '',
        scene: '',
      },
    });
    setTempInputs({});
    setVideoResults([]);
    setFinalVideoUrl('');
    setBackgroundMusic('none');
    setMusicVolume(0.2);
    setCurrentStep(1);
    setEditingSegment(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sessionData');
    }
  };
// --- END HANDLERS ---

// Handle temporary input change for editing
const handleTempInputChange = (key: string, value: string) => {
  setTempInputs((prev) => ({ ...prev, [key]: value }));
};

// Start editing a segment
const startEditing = (idx: number) => {
  setEditingSegment(idx);
  setTempInputs({
    [`script-${idx}`]: sessionData.script.segments[idx].script,
    [`image_desc-${idx}`]: sessionData.script.segments[idx].image_description ?? '',
  });
};

// Save editing changes to a segment
const saveEditing = (idx: number) => {
  const newSegments = [...sessionData.script.segments];
  newSegments[idx] = {
    ...newSegments[idx],
    script: tempInputs[`script-${idx}`] ?? newSegments[idx].script,
    image_description: tempInputs[`image_desc-${idx}`] ?? newSegments[idx].image_description,
  };
  setSessionData((prev) => ({
    ...prev,
    script: { ...prev.script, segments: newSegments },
  }));
  setEditingSegment(null);
  setTempInputs({});
  toast.success('Đã lưu chỉnh sửa phân đoạn!');
};

// Handle voice change for a segment
const handleVoiceChange = (idx: number, voiceName: string) => {
  const newSegments = [...sessionData.script.segments];
  newSegments[idx] = { ...newSegments[idx], voiceName };
  setSessionData((prev) => ({
    ...prev,
    script: { ...prev.script, segments: newSegments },
  }));
};

// Add a new segment after the given index
const handleAddSegment = (insertIdx: number) => {
  const newSegments = [...sessionData.script.segments];
  newSegments.splice(insertIdx + 1, 0, {
    script: '',
    image_description: '',
  });
  setSessionData((prev) => ({
    ...prev,
    script: { ...prev.script, segments: newSegments },
  }));
};

// Remove a segment by index
const handleRemoveSegment = (removeIdx: number) => {
  const newSegments = [...sessionData.script.segments];
  newSegments.splice(removeIdx, 1);
  setSessionData((prev) => ({
    ...prev,
    script: { ...prev.script, segments: newSegments },
  }));
};

// No unreachable or duplicate code remains below this point.

return (
  <div>
    {/* The main component JSX goes here. Ensure all top-level JSX is inside this fragment. */}
    <div className="bg-white shadow-xl rounded-2xl p-4 md:p-8 transition-all duration-300">
      <h2 className="text-2xl font-bold text-[hsl(160,83%,28%)] mb-2">Storyboard Video</h2>
      <p className="text-gray-500 mb-6">Kiểm tra và tạo video từng phân đoạn.</p>
      <StoryboardTable
        segments={sessionData.script.segments}
        voiceOptions={voiceOptions}
        videoResults={videoResults}
        openSegments={openSegments}
        modalVideo={modalVideo}
        setModalVideo={setModalVideo}
        editable={true}
        onEditSegment={startEditing}
        editingSegment={editingSegment}
        tempInputs={tempInputs}
        onTempInputChange={handleTempInputChange}
        onSaveEditing={saveEditing}
        onVoiceChange={handleVoiceChange}
        onGenerateImageForSegment={handleGenerateImageForSegment}
        onGenerateVoiceForSegment={handleGenerateVoiceForSegment}
        onCreateSegmentVideo={handleCreateSegmentVideo}
        onRemoveImage={handleRemoveImage}
        onUploadImage={handleUploadImage}
        isLoading={isLoading}
        voiceApiType={voiceApiType}
        onAddSegment={handleAddSegment}
        onRemoveSegment={handleRemoveSegment}
      />
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setCurrentStep(3)}
          disabled={isLoading || sessionData.script.segments.length === 0}
          className="w-full max-w-md bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Xác nhận kịch bản"
          title="Xác nhận kịch bản"
        >
          Xác Nhận Kịch Bản
        </button>
      </div>
      <div className="lg:hidden space-y-4">
        {sessionData.script.segments.map((segment: any, idx: number) => (
          <div key={idx} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[hsl(160,83%,28%)]">Phân đoạn {idx + 1}</h3>
              <button
                onClick={() => {
                  const newOpen = [...openSegments];
                  newOpen[idx] = !newOpen[idx];
                  setOpenSegments(newOpen);
                }}
                className="text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)]"
                aria-label={`Mở/đóng chi tiết phân đoạn ${idx + 1}`}
              >
                {openSegments[idx] ? 'Thu gọn' : 'Mở rộng'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600 truncate">{segment.script}</p>
            {openSegments[idx] && (
              <div className="mt-4 space-y-4">
                <div>
                  <strong className="text-sm font-medium">Nội dung:</strong>
                  {editingSegment === idx ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={tempInputs[`script-${idx}`] ?? segment.script}
                        onChange={(e) => handleTempInputChange(`script-${idx}`, e.target.value)}
                        className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-[hsl(160,83%,28%)]"
                        rows={3}
                      />
                      <input
                        value={tempInputs[`image_desc-${idx}`] ?? segment.image_description ?? ''}
                        onChange={(e) => handleTempInputChange(`image_desc-${idx}`, e.target.value)}
                        className="w-full border rounded p-2 text-sm italic text-gray-500 focus:ring-2 focus:ring-[hsl(160,83%,28%)]"
                        placeholder="Mô tả ảnh (tùy chọn)"
                      />
                      <button
                        onClick={() => saveEditing(idx)}
                        className="flex items-center text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)] text-sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm">{segment.script}</p>
                      <p className="text-xs italic text-gray-500">
                        {segment.image_description || 'Chưa có mô tả ảnh'}
                      </p>
                      <button
                        onClick={() => startEditing(idx)}
                        className="text-gray-500 hover:text-[hsl(160,83%,28%)] text-sm"
                      >
                        <Edit2 className="w-4 h-4 inline mr-1" />
                        Chỉnh sửa
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <strong className="text-sm font-medium">Ảnh minh họa:</strong>
                  {(segment.direct_image_url || segment.imageUrl || segment.image_base64) ? (
                    <div className="relative w-[120px] h-[120px] mt-2 rounded-xl border overflow-hidden">
                      <Image
                        src={
                          segment.direct_image_url ? toAbsoluteUrl(segment.direct_image_url) :
                          segment.imageUrl ? toAbsoluteUrl(segment.imageUrl) :
                          segment.image_base64 ? segment.image_base64 :
                          '/placeholder.png'
                        }
                        alt={`Ảnh ${idx + 1}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                      />
                      {currentStep < 3 ? (
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                          title="Xóa ảnh"
                        >
                          <svg width="18" height="18" fill="none" stroke="red" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCreateSegmentVideo(idx, 'basic')}
                            disabled={isLoading || !segment.direct_image_url}
                            className="w-10 h-10 rounded border bg-[hsl(160,83%,28%)] text-white hover:bg-[hsl(160,84%,39%)] disabled:bg-gray-400 disabled:opacity-50"
                            title={`Tạo video Server cho phân đoạn ${idx + 1}`}
                          >
                            <Video className="w-5 h-5 mx-auto" />
                          </button>
                          <button
                            onClick={() => handleCreateSegmentVideo(idx, 'premium')}
                            disabled={isLoading || !segment.direct_image_url}
                            className="w-10 h-10 rounded border bg-[hsl(174,84%,50%)] text-white hover:bg-[hsl(174,84%,60%)] disabled:bg-gray-400 disabled:opacity-50"
                            title={`Tạo video Vidu cho phân đoạn ${idx + 1}`}
                          >
                            <Video className="w-5 h-5 mx-auto" />
                          </button>
                          <button
                            onClick={() => handleCreateSegmentVideo(idx, 'super')}
                            disabled={isLoading || !segment.direct_image_url}
                            className="w-10 h-10 rounded border bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-50"
                            title={`Tạo video Tams cho phân đoạn ${idx + 1}`}
                          >
                            <Video className="w-5 h-5 mx-auto" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="text-gray-400 text-xs block mb-2">Chưa có ảnh</span>
                      {currentStep < 3 ? (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImage(e, idx)}
                          className="text-xs"
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                <div>
                  <strong className="text-sm font-medium">Audio:</strong>
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={segment.voiceName ?? ''}
                        onChange={(e) => handleVoiceChange(idx, e.target.value)}
                        className="flex-1 p-2 border rounded text-sm focus:ring-2 focus:ring-[hsl(160,83%,28%)]"
                      >
                        <option value="">Chọn giọng...</option>
                        {voiceOptions.map((voice: any) => (
                          <option key={voice.fileName} value={voice.fileName}>
                            {voice.displayName} {voiceApiType === 'vixtts' ? '(VixTTS)' : '(F5-TTS)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Nhân vật (tùy chọn)</label>
              <button
                onClick={handleGenerateScript}
                disabled={isLoading || !sessionData.subject || !sessionData.summary}
                className="w-full bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Tạo kịch bản
              </button>
            </div>
          </div>
        )
      )}
      {(currentStep === 2) && (
          <div className="bg-white shadow-xl rounded-2xl p-4 md:p-8 transition-all duration-300">
            <h2 className="text-2xl font-bold text-[hsl(160,83%,28%)] mb-2">Storyboard Video</h2>
            <p className="text-gray-500 mb-6">Kiểm tra và tạo video từng phân đoạn.</p>
            <StoryboardTable
              segments={sessionData.script.segments}
              voiceOptions={voiceOptions}
              videoResults={videoResults}
              openSegments={openSegments}
              modalVideo={modalVideo}
              setModalVideo={setModalVideo}
              editable={true}
              onEditSegment={startEditing}
              editingSegment={editingSegment}
              tempInputs={tempInputs}
              onTempInputChange={handleTempInputChange}
              onSaveEditing={saveEditing}
              onVoiceChange={handleVoiceChange}
              onGenerateImageForSegment={handleGenerateImageForSegment}
              onGenerateVoiceForSegment={handleGenerateVoiceForSegment}
              onCreateSegmentVideo={handleCreateSegmentVideo}
              onRemoveImage={handleRemoveImage}
              onUploadImage={handleUploadImage}
              isLoading={isLoading}
              voiceApiType={voiceApiType}
              onAddSegment={handleAddSegment}
              onRemoveSegment={handleRemoveSegment}
            />
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setCurrentStep(3)}
                disabled={isLoading || sessionData.script.segments.length === 0}
                className="w-full max-w-md bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Xác nhận kịch bản"
                title="Xác nhận kịch bản"
              >
                Xác Nhận Kịch Bản
              </button>
            </div>
            <div className="lg:hidden space-y-4">
              {sessionData.script.segments.map((segment, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[hsl(160,83%,28%)]">Phân đoạn {idx + 1}</h3>
                    <button
                      onClick={() => {
                        const newOpen = [...openSegments];
                        newOpen[idx] = !newOpen[idx];
                        setOpenSegments(newOpen);
                      }}
                      className="text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)]"
                      aria-label={`Mở/đóng chi tiết phân đoạn ${idx + 1}`}
                    >
                      {openSegments[idx] ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 truncate">{segment.script}</p>
                  {openSegments[idx] && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <strong className="text-sm font-medium">Nội dung:</strong>
                        {editingSegment === idx ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={tempInputs[`script-${idx}`] ?? segment.script}
                              onChange={(e) => handleTempInputChange(`script-${idx}`, e.target.value)}
                              className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-[hsl(160,83%,28%)]"
                              rows={3}
                            />
                            <input
                              value={tempInputs[`image_desc-${idx}`] ?? segment.image_description ?? ''}
                              onChange={(e) => handleTempInputChange(`image_desc-${idx}`, e.target.value)}
                              className="w-full border rounded p-2 text-sm italic text-gray-500 focus:ring-2 focus:ring-[hsl(160,83%,28%)]"
                              placeholder="Mô tả ảnh (tùy chọn)"
                            />
                            <button
                              onClick={() => saveEditing(idx)}
                              className="flex items-center text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)] text-sm"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Lưu
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <p className="text-sm">{segment.script}</p>
                            <p className="text-xs italic text-gray-500">
                              {segment.image_description || 'Chưa có mô tả ảnh'}
                            </p>
                            <button
                              onClick={() => startEditing(idx)}
                              className="text-gray-500 hover:text-[hsl(160,83%,28%)] text-sm"
                            >
                              <Edit2 className="w-4 h-4 inline mr-1" />
                              Chỉnh sửa
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <strong className="text-sm font-medium">Ảnh minh họa:</strong>
                        {(segment.direct_image_url || segment.imageUrl || segment.image_base64) ? (
                          <div className="relative w-[120px] h-[120px] mt-2 rounded-xl border overflow-hidden">
                            <Image
                              src={
                                segment.direct_image_url ? toAbsoluteUrl(segment.direct_image_url) :
                                segment.imageUrl ? toAbsoluteUrl(segment.imageUrl) :
                                segment.image_base64 ? segment.image_base64 :
                                '/placeholder.png'
                              }
                              alt={`Ảnh ${idx + 1}`}
                              fill
                              className="object-cover"
                              loading="lazy"
                            />
                            {currentStep < 3 ? (
                              <button
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                                title="Xóa ảnh"
                              >
                                <svg width="18" height="18" fill="none" stroke="red" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCreateSegmentVideo(idx, 'basic')}
                                  disabled={isLoading || !segment.direct_image_url}
                                  className="w-10 h-10 rounded border bg-[hsl(160,83%,28%)] text-white hover:bg-[hsl(160,84%,39%)] disabled:bg-gray-400 disabled:opacity-50"
                                  title={`Tạo video Server cho phân đoạn ${idx + 1}`}
                                >
                                  <Video className="w-5 h-5 mx-auto" />
                                </button>
                                <button
                                  onClick={() => handleCreateSegmentVideo(idx, 'premium')}
                                  disabled={isLoading || !segment.direct_image_url}
                                  className="w-10 h-10 rounded border bg-[hsl(174,84%,50%)] text-white hover:bg-[hsl(174,84%,60%)] disabled:bg-gray-400 disabled:opacity-50"
                                  title={`Tạo video Vidu cho phân đoạn ${idx + 1}`}
                                >
                                  <Video className="w-5 h-5 mx-auto" />
                                </button>
                                <button
                                  onClick={() => handleCreateSegmentVideo(idx, 'super')}
                                  disabled={isLoading || !segment.direct_image_url}
                                  className="w-10 h-10 rounded border bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-50"
                                  title={`Tạo video Tams cho phân đoạn ${idx + 1}`}
                                >
                                  <Video className="w-5 h-5 mx-auto" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2">
                            <span className="text-gray-400 text-xs block mb-2">Chưa có ảnh</span>
                            {currentStep < 3 ? (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadImage(e, idx)}
                                className="text-xs"
                              />
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div>
                        <strong className="text-sm font-medium">Audio:</strong>
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={segment.voiceName ?? ''}
                              onChange={(e) => handleVoiceChange(idx, e.target.value)}
                              className="flex-1 p-2 border rounded text-sm focus:ring-2 focus:ring-[hsl(160,83%,28%)]"
                            >
                              <option value="">Chọn giọng...</option>
                              {voiceOptions.map((voice) => (
                                <option key={voice.fileName} value={voice.fileName}>
                                  {voice.displayName} {voiceApiType === 'vixtts' ? '(VixTTS)' : '(F5-TTS)'}
                                </option>
                              ))}
                            </select>
                            {segment.voiceName && (
                              <button
                                onClick={() => {
                                  const audio = new Audio(`/ref_voices/${segment.voiceName}`);
                                  audio.play().catch(() => toast.error('Không thể phát giọng mẫu!'));
                                }}
                                className="w-10 h-10 rounded border bg-gray-100 text-gray-600 hover:bg-gray-200"
                                title="Nghe giọng mẫu"
                              >
                                <Play className="w-5 h-5 mx-auto" />
                              </button>
                            )}
                          </div>
                          {segment.voice_url ? (
                            <audio controls src={segment.voice_url} className="w-full" />
                          ) : (
                            <span className="text-gray-400 text-xs">Chưa có audio</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong className="text-sm font-medium">Video phân đoạn:</strong>
                        {videoResults[idx]?.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {videoResults[idx].map((video, vIdx) => (
                              <div key={vIdx} className="text-center">
                                <button
                                  onClick={() => setModalVideo({ url: video.url, type: video.type })}
                                  className="focus:outline-none"
                                  aria-label={`Xem video ${video.type} phân đoạn ${idx + 1}`}
                                >
                                  <video
                                    src={video.url}
                                    className="w-40 h-[90px] rounded-lg object-cover"
                                    poster={
                                      segment.direct_image_url ? toAbsoluteUrl(segment.direct_image_url) :
                                      segment.imageUrl ? toAbsoluteUrl(segment.imageUrl) :
                                      segment.image_base64 ? toAbsoluteUrl(segment.image_base64) :
                                      '/placeholder.png'
                                    }
                                    muted
                                    aria-hidden="true"
                                  />
                                </button>
                                <span className="mt-1 block text-xs uppercase text-gray-500">{video.type}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs block mt-2">Chưa có video</span>
                        )}
                      </div>
                      <div>
                        <strong className="text-sm font-medium">Thao tác:</strong>
                        <div className="mt-2 flex gap-2">
                          {currentStep < 3 ? (
                            <>
                              <button
                                onClick={() => handleGenerateImageForSegment(idx)}
                                disabled={isLoading || !segment.script}
                                className="w-10 h-10 rounded border bg-[hsl(160,83%,28%)] text-white hover:bg-[hsl(160,84%,39%)] disabled:bg-gray-400 disabled:opacity-50"
                                title={`Tạo ảnh minh họa cho phân đoạn ${idx + 1}`}
                              >
                                <ImageIcon className="w-5 h-5 mx-auto" />
                              </button>
                              <button
                                onClick={() => handleGenerateVoiceForSegment(idx, voiceApiType)}
                                disabled={isLoading || !segment.script || !segment.voiceName}
                                className="w-10 h-10 rounded border bg-[hsl(174,84%,50%)] text-white hover:bg-[hsl(174,84%,60%)] disabled:bg-gray-400 disabled:opacity-50"
                                title={`Tạo giọng đọc cho phân đoạn ${idx + 1}`}
                              >
                                <Mic className="w-5 h-5 mx-auto" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCreateSegmentVideo(idx, 'basic')}
                                disabled={isLoading || !segment.direct_image_url}
                                className="w-10 h-10 rounded border bg-[hsl(160,83%,28%)] text-white hover:bg-[hsl(160,84%,39%)] disabled:bg-gray-400 disabled:opacity-50"
                                title={`Tạo video Server cho phân đoạn ${idx + 1}`}
                              >
                                <Video className="w-5 h-5 mx-auto" />
                              </button>
                              <button
                                onClick={() => handleCreateSegmentVideo(idx, 'premium')}
                                disabled={isLoading || !segment.direct_image_url}
                                className="w-10 h-10 rounded border bg-[hsl(174,84%,50%)] text-white hover:bg-[hsl(174,84%,60%)] disabled:bg-gray-400 disabled:opacity-50"
                                title={`Tạo video Vidu cho phân đoạn ${idx + 1}`}
                              >
                                <Video className="w-5 h-5 mx-auto" />
                              </button>
                              <button
                                onClick={() => handleCreateSegmentVideo(idx, 'super')}
                                disabled={isLoading || !segment.direct_image_url}
                                className="w-10 h-10 rounded border bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-50"
                                title={`Tạo video Tams cho phân đoạn ${idx + 1}`}
                              >
                                <Video className="w-5 h-5 mx-auto" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-6">
                <button
                  onClick={handleConcatVideos}
                  disabled={isLoading || !sessionData.script.segments.some((seg) => seg.video_path)}
                  className="w-full bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Ghép tất cả video thành video tổng"
                  title="Ghép tất cả video thành video tổng"
                >
                  Tạo Video
                </button>
              </div>
            </div>
            <Modal
              isOpen={!!modalVideo}
              onRequestClose={() => setModalVideo(null)}
              className="modal"
              overlayClassName="modal-overlay"
              aria={{
                labelledby: 'video-modal-title',
                describedby: 'video-modal-description',
              }}
            >
              <h2 id="video-modal-title" className="text-xl font-semibold mb-4">
                Video {modalVideo?.type} phân đoạn
              </h2>
              <div id="video-modal-description">
                {modalVideo && (
                  <video
                    src={modalVideo.url}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-full rounded"
                    aria-label={`Video ${modalVideo.type}`}
                  />
                )}
              </div>
              <button
                onClick={() => setModalVideo(null)}
                className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                aria-label="Đóng video"
              >
                Đóng
              </button>
            </Modal>
            <button
              onClick={() => setCurrentStep(1)}
              className="mt-4 text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)] font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại bước nhập thông tin
            </button>
          </div>
        )}
        {currentStep === 3 && (
          <><div className="bg-white shadow-lg rounded-xl p-6 transform transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Bước 3: Ghép video tổng</h2>
            <StoryboardTable
              segments={sessionData.script.segments}
              voiceOptions={voiceOptions}
              videoResults={videoResults}
              openSegments={openSegments}
              modalVideo={modalVideo}
              setModalVideo={setModalVideo}
              voiceApiType={voiceApiType} />
            <button
              onClick={handleConcatVideos}
              disabled={isLoading || !sessionData.script.segments.some((seg) => seg.video_path)}
              className="w-full bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 md:hidden"
              aria-label="Tạo video tổng hợp từ các video"
              title="Tạo video tổng hợp từ các video"
            >
              Tạo Video
            </button>
          </div>
          <button
            onClick={() => setCurrentStep(2)}
            className="mt-4 text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)] font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Quay Lại
          </button>
        </>)}
        {currentStep === 4 && (
          <div className="bg-white shadow-lg rounded-xl p-6 transform transition-all duration-300">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hoàn tất</h2>
            <p className="text-lg text-gray-600 mb-6">Video của bạn đã sẵn sàng!</p>
            {finalVideoUrl && (
              <div className="flex items-center justify-center mb-6">
                <video controls src={finalVideoUrl} className="w-full max-w-md rounded-lg" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={handleCleanup}
                disabled={isLoading || (!finalVideoUrl && !sessionData.script.segments.length)}
                className="w-full bg-[hsl(160,83%,28%)] text-white px-6 py-3 rounded-lg hover:bg-[hsl(160,84%,39%)] transition-all duration-200"
              >
                Bắt Đầu Lại
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)] font-medium flex items-center"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Quay Lại
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div
            style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
            className="flex items-center bg-white shadow-lg rounded-xl px-4 py-3 border border-gray-200 animate-fade-in"
          >
            <Loader2 className="animate-spin h-6 w-6 text-[hsl(160,83%,28%)] mr-3" />
            <span className="text-gray-800 font-medium">{loadingMessage}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default DashboardWorkflow;