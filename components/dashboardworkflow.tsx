import React, { useState, useEffect, useCallback } from 'react';
import StoryboardTable from './StoryboardTable';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { ImageIcon, Mic, Video, Loader2, Edit2, Save, Play, Info } from 'lucide-react';
import debounce from 'lodash/debounce';
import Modal from 'react-modal';
import { toAbsoluteUrl } from '../lib/toAbsoluteUrl';
import type { BasicVideoRequest } from './types';

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

const DashboardWorkflow: React.FC = () => {
  // Handler to add a new segment
  // Handler to add a new segment at a specific index (insert)
  const handleAddSegment = (insertIdx: number) => {
    setSessionData((prev) => {
      const newSegment = {
        script: '',
        image_description: '',
        direct_image_url: '',
        image_path: '',
        imageUrl: '',
        image_base64: '',
        voice_url: '',
        voice_path: '',
        video_path: '',
        voiceName: '',
      };
      const newSegments = [
        ...prev.script.segments.slice(0, insertIdx),
        newSegment,
        ...prev.script.segments.slice(insertIdx),
      ];
      return {
        ...prev,
        script: {
          ...prev.script,
          segments: newSegments,
        },
      };
    });
    setVideoResults((prev) => {
      const newArr = [...prev];
      newArr.splice(insertIdx, 0, []);
      return newArr;
    });
    setOpenSegments((prev) => {
      const newArr = [...prev];
      newArr.splice(insertIdx, 0, false);
      return newArr;
    });
  };

  // Handler to remove a segment by index
  const handleRemoveSegment = (removeIdx: number) => {
    setSessionData((prev) => {
      const newSegments = prev.script.segments.filter((_, idx) => idx !== removeIdx);
      return {
        ...prev,
        script: {
          ...prev.script,
          segments: newSegments,
        },
      };
    });
    setVideoResults((prev) => prev.filter((_, idx) => idx !== removeIdx));
    setOpenSegments((prev) => prev.filter((_, idx) => idx !== removeIdx));
  };


  const [sessionData, setSessionData] = useState<SessionData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to default
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

  useEffect(() => {
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

  const handleTempInputChange = useCallback((key: string, value: string) => {
    setTempInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const syncSessionData = useCallback(
    debounce((newData: Partial<SessionData>) => {
      setSessionData((prev) => ({ ...prev, ...newData }));
    }, 300),
    []
  );

  const syncSegmentField = useCallback(
    debounce((idx: number, field: keyof Segment, value: string) => {
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = { ...newSegments[idx], [field]: value };
      setSessionData((prev) => ({
        ...prev,
        script: { ...prev.script, segments: newSegments },
      }));
    }, 300),
    [sessionData.script.segments]
  );

  const startEditing = (idx: number) => {
    setEditingSegment(idx);
    setTempInputs((prev) => ({
      ...prev,
      [`script-${idx}`]: sessionData.script.segments[idx].script,
      [`image_desc-${idx}`]: sessionData.script.segments[idx].image_description ?? '',
    }));
  };

  const saveEditing = (idx: number) => {
    const scriptValue = tempInputs[`script-${idx}`] ?? sessionData.script.segments[idx].script;
    const imageDescValue = tempInputs[`image_desc-${idx}`] ?? sessionData.script.segments[idx].image_description ?? '';
    syncSegmentField(idx, 'script', scriptValue);
    syncSegmentField(idx, 'image_description', imageDescValue);
    setEditingSegment(null);
  };

  const handleVoiceChange = (idx: number, voiceName: string) => {
    handleEditSegmentField(idx, 'voiceName', voiceName);
  };

  const setLoading = (loading: boolean, message: string = '') => {
    setIsLoading(loading);
    setLoadingMessage(message);
  };

  const validateStyleSettings = (settings: SessionData['styleSettings']) => {
    if (!styleOptions.some((opt) => opt.value === settings.style)) {
      toast.error('Phong cách ảnh không hợp lệ!');
      return false;
    }
    if (settings.character.length > 100) {
      toast.error('Mô tả nhân vật không được vượt quá 100 ký tự!');
      return false;
    }
    if (settings.scene.length > 100) {
      toast.error('Mô tả bối cảnh không được vượt quá 100 ký tự!');
      return false;
    }
    return true;
  };

  const handleGenerateScript = async () => {
    if (!sessionData.subject || !sessionData.summary) {
      toast.error('Vui lòng nhập chủ đề và tóm tắt!');
      return;
    }
    if (!validateStyleSettings(sessionData.styleSettings)) {
      return;
    }
    setLoading(true, 'Đang tạo kịch bản...');
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
      setSessionData((prev) => ({ ...prev, script: newScript }));
      setVideoResults(new Array(data.script.segments.length).fill([]));
      setCurrentStep(2);
      toast.success('Đã tạo kịch bản thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo kịch bản!');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSegmentField = (idx: number, field: keyof Segment, value: string) => {
    const newSegments = [...sessionData.script.segments];
    newSegments[idx] = { ...newSegments[idx], [field]: value };
    setSessionData((prev) => ({
      ...prev,
      script: { ...prev.script, segments: newSegments },
    }));
  };

  const handleRemoveImage = (idx: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    const newSegments = [...sessionData.script.segments];
    newSegments[idx] = {
      ...newSegments[idx],
      direct_image_url: undefined,
      imageUrl: undefined,
      image_base64: undefined,
      image_path: undefined,
    };
    setSessionData((prev) => ({
      ...prev,
      script: { ...prev.script, segments: newSegments },
    }));
    toast.success('Đã xóa ảnh!');
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true, 'Đang upload ảnh...');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            segmentIdx: idx,
            styleSettings: sessionData.styleSettings,
          }),
        });
        const data = await res.json();
        if (!data.success || !data.direct_image_url) {
          toast.error(data.error || 'Lỗi khi upload ảnh!');
          setLoading(false);
          return;
        }
        const newSegments = [...sessionData.script.segments];
        newSegments[idx] = {
          ...newSegments[idx],
          direct_image_url: data.direct_image_url,
          imageUrl: data.imageUrl,
          image_base64: data.image_base64,
        };
        setSessionData((prev) => ({
          ...prev,
          script: { ...prev.script, segments: newSegments },
        }));
        toast.success('Upload ảnh thành công!');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi upload ảnh!');
      setLoading(false);
    }
  };

  const handleGenerateImageForSegment = async (idx: number) => {
    const segment = sessionData.script.segments[idx];
    if (!segment.script) {
      toast.error(`Phân đoạn ${idx + 1} chưa có kịch bản!`);
      return;
    }
    setLoading(true, `Đang tạo ảnh cho phân đoạn ${idx + 1}...`);
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: segment.image_description || segment.script,
          segmentIdx: idx,
          styleSettings: sessionData.styleSettings,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || `Lỗi khi tạo ảnh cho phân đoạn ${idx + 1}`);
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = {
        ...newSegments[idx],
        direct_image_url: data.direct_image_url || (data.imageUrl && !data.imageUrl.startsWith('data:image') ? data.imageUrl : undefined),
        imageUrl: data.imageUrl,
        image_base64: data.image_base64 || (data.imageUrl && data.imageUrl.startsWith('data:image') ? data.imageUrl : undefined),
      };
      setSessionData((prev) => ({
        ...prev,
        script: { ...prev.script, segments: newSegments },
      }));
      toast.success(`Đã tạo ảnh cho phân đoạn ${idx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo ảnh cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVoiceForSegment = async (idx: number, voiceApiType: 'f5-tts' | 'vixtts') => {
    const segment = sessionData.script.segments[idx];
    if (!segment.script) {
      toast.error(`Phân đoạn ${idx + 1} chưa có kịch bản!`);
      return;
    }
    if (!segment.voiceName) {
      toast.error(`Vui lòng chọn giọng cho phân đoạn ${idx + 1}!`);
      return;
    }
    setLoading(true, `Đang tạo giọng (${voiceApiType === 'vixtts' ? 'VixTTS' : 'F5-TTS'}) cho phân đoạn ${idx + 1}...`);
    try {
      const payload = {
        text: segment.script,
        segmentIdx: idx,
        voiceName: segment.voiceName,
        voiceApiType,
        ...(voiceApiType === 'vixtts' ? { language: 'vi', normalizeText: true } : { speed: 1 }),
      };

      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success || !data.voiceUrl) {
        throw new Error(data.error || `Lỗi khi tạo giọng cho phân đoạn ${idx + 1}`);
      }

      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = {
        ...newSegments[idx],
        voice_url: data.voiceUrl,
        voice_path: data.voiceUrl,
      };
      setSessionData((prev) => ({
        ...prev,
        script: { ...prev.script, segments: newSegments },
      }));
      toast.success(`Đã tạo giọng (${voiceApiType === 'vixtts' ? 'VixTTS' : 'F5-TTS'}) cho phân đoạn ${idx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo giọng cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!sessionData.script.segments.length) {
      toast.error('Chưa có kịch bản để tạo ảnh!');
      return;
    }
    setLoading(true, 'Đang tạo tất cả ảnh minh họa...');
    try {
      const imagePromises = sessionData.script.segments.map(async (segment, idx) => {
        if (segment.direct_image_url || segment.imageUrl) return null;
        const res = await fetch('/api/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: segment.image_description || segment.script,
            segmentIdx: idx,
            styleSettings: sessionData.styleSettings,
          }),
        });
        const data = await res.json();
        if (!data.success || !data.imageUrl) {
          throw new Error(data.error || `Lỗi khi tạo ảnh cho phân đoạn ${idx + 1}`);
        }
        return {
          idx,
          direct_image_url: data.direct_image_url || (data.imageUrl && !data.imageUrl.startsWith('data:image') ? data.imageUrl : undefined),
          imageUrl: data.imageUrl,
          image_base64: data.image_base64 || (data.imageUrl && data.imageUrl.startsWith('data:image') ? data.imageUrl : undefined),
        };
      });
      const results = (await Promise.all(imagePromises)).filter((r): r is NonNullable<typeof r> => r !== null);
      const newSegments = [...sessionData.script.segments];
      results.forEach(({ idx, direct_image_url, imageUrl, image_base64 }) => {
        newSegments[idx] = {
          ...newSegments[idx],
          direct_image_url,
          imageUrl,
          image_base64,
        };
      });
      setSessionData((prev) => ({
        ...prev,
        script: { ...prev.script, segments: newSegments },
      }));
      toast.success('Đã tạo tất cả ảnh minh họa!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo ảnh!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegmentVideo = async (idx: number, type: 'basic' | 'premium' | 'super') => {
    const segment = sessionData.script.segments[idx];
    if (!segment) {
      toast.error(`Phân đoạn ${idx + 1} không tồn tại!`);
      return;
    }
    const rawImageUrl = segment.direct_image_url || segment.image_path;
    if (!rawImageUrl) {
      toast.error(`Phân đoạn ${idx + 1} chưa có ảnh minh họa!`);
      return;
    }
    setLoading(true, `Đang tạo video ${type} cho phân đoạn ${idx + 1}...`);
    try {
      const imageUrl = toAbsoluteUrl(rawImageUrl);
      const requestBody: BasicVideoRequest = {
        imageUrl,
        voiceUrl: segment.voice_url,
        segmentIdx: idx,
        platform: sessionData.platform,
      };
      let videoUrl: string;
      if (type === 'basic') {
        const res = await fetch('/api/create-basic-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const data = await res.json();
        if (!data.success || !data.videoUrl) {
          throw new Error(data.error || 'Lỗi khi tạo video Basic');
        }
        videoUrl = data.videoUrl;
        const fileCheck = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${videoUrl}`, {
          method: 'HEAD',
        });
        if (!fileCheck.ok) {
          throw new Error(`Generated video not found: ${videoUrl}`);
        }
      } else {
        throw new Error('Only basic video type is supported in this example');
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = { ...newSegments[idx], video_path: videoUrl };
      setSessionData((prev) => ({
        ...prev,
        script: { ...prev.script, segments: newSegments },
      }));
      setVideoResults((prev) => {
        const newResults = [...prev];
        if (!newResults[idx]) newResults[idx] = [];
        newResults[idx] = newResults[idx].filter((v) => v.type !== type);
        newResults[idx].push({ type, url: videoUrl });
        return newResults;
      });
      toast.success(`Tạo video ${type} cho phân đoạn ${idx + 1} thành công!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo video ${type} cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllVideos = async () => {
    if (!sessionData.script.segments.every((seg) => seg.direct_image_url)) {
      toast.error('Vui lòng tạo ảnh minh họa cho tất cả phân đoạn trước!');
      return;
    }
    setLoading(true, 'Đang tạo tất cả video...');
    try {
      for (let idx = 0; idx < sessionData.script.segments.length; idx++) {
        const seg = sessionData.script.segments[idx];
        if (!seg.voice_url && !seg.voice_path) {
          console.warn(`Bỏ qua segment ${idx + 1} vì chưa có voice_url/voice_path`);
          continue;
        }
        if (!seg.video_path) {
          await handleCreateSegmentVideo(idx, 'basic');
        }
      }
      toast.success('Đã tạo tất cả video!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo video!');
    } finally {
      setLoading(false);
    }
  };

  const handleConcatVideos = async () => {
    if (!sessionData.script.segments.some((seg) => seg.video_path)) {
      toast.error('Chưa có video phân đoạn nào để ghép!');
      return;
    }
    setLoading(true, 'Đang ghép video tổng...');
    try {
      const videoFiles = sessionData.script.segments
        .map((seg) => seg.video_path)
        .filter((v): v is string => !!v);
      const payload: any = {
        videoFiles,
        musicFile: backgroundMusic !== 'none' ? backgroundMusic : undefined,
        musicVolume,
        platform: sessionData.platform,
      };
      const res = await fetch('/api/concat-videos-with-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.videoUrl) {
        setFinalVideoUrl(data.videoUrl);
        toast.success('Ghép video tổng thành công!');
        setCurrentStep(4);
      } else {
        toast.error(data.error || 'Lỗi khi ghép video tổng!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi ghép video tổng!');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true, 'Đang dọn dẹp file cũ...');
    try {
      const res = await fetch('/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi khi dọn dẹp file');
      }
      toast.success('Đã dọn dẹp file cũ thành công!');
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
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi dọn dẹp file!');
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = () => (
    <div className="flex items-center justify-between mb-6">
      {['Nhập thông tin', 'Tạo nội dung', 'Ghép video', 'Hoàn tất'].map((step, index) => (
        <div key={index} className="flex-1 text-center">
          <div
            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white font-semibold ${
              currentStep > index + 1
                ? 'bg-[hsl(160,83%,28%)]'
                : currentStep === index + 1
                ? 'bg-[hsl(174,84%,50%)]'
                : 'bg-gray-300'
            }`}
          >
            {index + 1}
          </div>
          <p className="text-xs mt-1 text-gray-600">{step}</p>
        </div>
      ))}
    </div>
  );

  const selectedStyle = styleOptions.find((opt) => opt.value === sessionData.styleSettings.style) || styleOptions[0];

  return (
    <div className="min-h-screen bg-white-100 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-7xl w-full space-y-6">
        <ProgressBar />
        {currentStep === 1 && (
          <div className="bg-white shadow-lg rounded-xl p-6 transform transition-all duration-300">
            <h1 className="text-2xl font-bold text-[hsl(160,83%,28%)] mb-4">Nhập Thông Tin Video</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Chủ đề video</label>
                <input
                  type="text"
                  value={tempInputs['subject'] ?? sessionData.subject}
                  onChange={(e) => {
                    handleTempInputChange('subject', e.target.value);
                    syncSessionData({ subject: e.target.value });
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                  placeholder="Ví dụ: Cách học tiếng Anh hiệu quả"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Tóm tắt nội dung</label>
                <textarea
                  value={tempInputs['summary'] ?? sessionData.summary}
                  onChange={(e) => {
                    handleTempInputChange('summary', e.target.value);
                    syncSessionData({ summary: e.target.value });
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                  placeholder="Ví dụ: Video hướng dẫn cách mẹo học tiếng Anh nhanh, để nhớ nhanh cho người mới bắt đầu."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Nền tảng</label>
                <select
                  value={sessionData.platform}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, platform: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Độ dài video (giây)</label>
                <input
                  type="number"
                  value={tempInputs['duration'] ?? sessionData.duration}
                  onChange={(e) => {
                    handleTempInputChange('duration', e.target.value);
                    syncSessionData({ duration: e.target.value });
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                  min="10"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left flex items-center">
                  Phong cách ảnh
                  <span className="ml-2 text-gray-500 cursor-pointer" title={selectedStyle.description}>
                    <Info className="w-4 h-4" />
                  </span>
                </label>
                <select
                  value={sessionData.styleSettings.style}
                  onChange={(e) =>
                    setSessionData((prev) => ({
                      ...prev,
                      styleSettings: { ...prev.styleSettings, style: e.target.value },
                    }))
                  }
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                >
                  {styleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Nhân vật (tùy chọn)</label>
                <input
                  type="text"
                  value={tempInputs['character'] ?? sessionData.styleSettings.character}
                  onChange={(e) => {
                    handleTempInputChange('character', e.target.value);
                    syncSessionData({
                      styleSettings: { ...sessionData.styleSettings, character: e.target.value },
                    });
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                  placeholder={selectedStyle.characterPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Bối cảnh (tùy chọn)</label>
                <input
                  type="text"
                  value={tempInputs['scene'] ?? sessionData.styleSettings.scene}
                  onChange={(e) => {
                    handleTempInputChange('scene', e.target.value);
                    syncSessionData({
                      styleSettings: { ...sessionData.styleSettings, scene: e.target.value },
                    });
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                  placeholder={selectedStyle.scenePlaceholder}
                />
              </div>
              <button
                onClick={handleGenerateScript}
                disabled={isLoading || !sessionData.subject || !sessionData.summary}
                className="w-full bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Tạo kịch bản
              </button>
            </div>
          </div>
        )}
        {currentStep === 2 && (
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
                                segment.image_base64 ||
                                segment.direct_image_url ||
                                segment.imageUrl ||
                                '/placeholder.png'
                              }
                              alt={`Ảnh ${idx + 1}`}
                              fill
                              className="object-cover"
                              loading="lazy"
                            />
                            <button
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                              title="Xóa ảnh"
                            >
                              <svg width="18" height="18" fill="none" stroke="red" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <span className="text-gray-400 text-xs block mb-2">Chưa có ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadImage(e, idx)}
                              className="text-xs"
                            />
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
                                      segment.image_base64 ||
                                      segment.direct_image_url ||
                                      segment.imageUrl ||
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
                          <button
                            onClick={() => handleCreateSegmentVideo(idx, 'basic')}
                            disabled={isLoading || !segment.direct_image_url}
                            className="w-10 h-10 rounded border bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-50"
                            title={`Tạo video Basic cho phân đoạn ${idx + 1}`}
                          >
                            <Video className="w-5 h-5 mx-auto" />
                          </button>
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
          <div className="bg-white shadow-lg rounded-xl p-6 transform transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Bước 3: Ghép video tổng</h2>
            <StoryboardTable
              segments={sessionData.script.segments}
              voiceOptions={voiceOptions}
              videoResults={videoResults}
              openSegments={openSegments}
              modalVideo={modalVideo}
              setModalVideo={setModalVideo}
              editable={false}
              voiceApiType={voiceApiType}
            />
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Nhạc nền</label>
                <select
                  value={backgroundMusic}
                  onChange={(e) => setBackgroundMusic(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                >
                  <option value="none">Không có</option>
                  <option value="Music 1.mp3">Music 1</option>
                  <option value="Music 2.mp3">Music 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Âm lượng nhạc nền: {musicVolume.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-full accent-[hsl(160,83%,28%)]"
                />
              </div>
              <button
                onClick={handleConcatVideos}
                disabled={isLoading || !sessionData.script.segments.some((seg) => seg.video_path)}
                className="w-full bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Sản Xuất Video
              </button>
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
          </div>
        )}
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
  );
};

export default DashboardWorkflow;