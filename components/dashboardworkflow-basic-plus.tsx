// Placeholder: Content will be copied and modified from dashboardworkflow-basic.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import StoryboardTable from './StoryboardTable';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { ImageIcon, Mic, Video, Loader2, Edit2, Save, Play, Info, Share2, Mail, Download, RotateCcw, Search, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import debounce from 'lodash/debounce';
import Modal from 'react-modal';
import { toAbsoluteUrl } from '../lib/toAbsoluteUrl';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Interfaces (reuse from Basic workflow with additions)
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
  // New fields for Basic+
  pexels_video_id?: number;
  pexels_video_url?: string;
  pexels_download_url?: string;
  pexels_thumbnail?: string;
}

interface Script {
  title: string;
  segments: Segment[];
  platform?: string;
  platform_width?: number;
  platform_height?: number;
}

interface SessionData {
  session_id?: string;
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

// New interface for Pexels video search results
interface PexelsVideo {
  id: number;
  thumbnail: string;
  duration: number;
  previewUrl: string;
  downloadUrl: string;
  pexelsUrl: string;
  photographer: string;
  photographerUrl: string;
  width: number;
  height: number;
}

const platformSizes: Record<string, { width: number; height: number }> = {
  TikTok: { width: 720, height: 1280 },
  YouTube: { width: 1280, height: 720 },
  Instagram: { width: 1080, height: 1080 },
};

const styleOptions = [
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

const DashboardWorkflowBasicPlus: React.FC = () => {
  // State variables
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionDataBasicPlus');
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

  // Video search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PexelsVideo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeSegmentForSearch, setActiveSegmentForSearch] = useState<number | null>(null);
  const [showVideoSearch, setShowVideoSearch] = useState<boolean>(false);

  // Other state variables
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
  
  // Save sessionData to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionDataBasicPlus', JSON.stringify(sessionData));
    }
  }, [sessionData]);

  // Initialize Modal
  useEffect(() => {
    if (typeof window !== 'undefined' && document.body) {
      Modal.setAppElement(document.body);
    }
  }, []);

  // Initialize openSegments array
  useEffect(() => {
    setOpenSegments(new Array(sessionData.script.segments.length).fill(false));
  }, [sessionData.script.segments.length]);

  // Fetch voice options
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

  // Utility functions
  const setLoading = (loading: boolean, message: string = '') => {
    setIsLoading(loading);
    setLoadingMessage(message);
  };

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

  // Helper function to determine orientation based on platform
  const getOrientation = (platform: string): string => {
    switch (platform) {
      case 'TikTok': return 'portrait';
      case 'YouTube': return 'landscape';
      case 'Instagram': return 'square';
      default: return 'landscape';
    }
  };

  // Search for videos
  const handleSearchVideos = async (query: string, segmentIdx: number) => {
    if (!query.trim()) {
      toast.error('Vui lòng nhập từ khóa tìm kiếm!');
      return;
    }
    
    setIsSearching(true);
    setActiveSegmentForSearch(segmentIdx);
    setShowVideoSearch(true);
    
    try {
      const res = await fetch(`/api/search-pexels-videos?query=${encodeURIComponent(query)}&orientation=${getOrientation(sessionData.platform)}`);
      const data = await res.json();
      
      if (data.videos && Array.isArray(data.videos)) {
        setSearchResults(data.videos);
      } else {
        throw new Error('Không tìm thấy video phù hợp');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tìm kiếm video!');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle video selection
  const handleSelectVideo = async (video: PexelsVideo, segmentIdx: number) => {
    setLoading(true, `Đang tải video cho phân đoạn ${segmentIdx + 1}...`);
    
    try {
      // First, download the video
      const res = await fetch('/api/download-pexels-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadUrl: video.downloadUrl,
          sessionId: sessionData.session_id || `session_${Date.now()}`,
          segmentIndex: segmentIdx
        })
      });
      
      const data = await res.json();
      
      if (!data.success || !data.video_path) {
        throw new Error(data.error || 'Lỗi khi tải video');
      }
      
      // Update segment with video information
      const newSegments = [...sessionData.script.segments];
      newSegments[segmentIdx] = {
        ...newSegments[segmentIdx],
        pexels_video_id: video.id,
        pexels_video_url: video.pexelsUrl,
        pexels_download_url: video.downloadUrl,
        pexels_thumbnail: video.thumbnail,
        direct_image_url: video.thumbnail, // Use thumbnail as preview image
        imageUrl: video.thumbnail, // Use thumbnail as preview image
        video_path: data.video_path
      };
      
      setSessionData((prev) => ({
        ...prev,
        script: { ...prev.script, segments: newSegments },
      }));
      
      setShowVideoSearch(false);
      toast.success(`Đã chọn video cho phân đoạn ${segmentIdx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi chọn video cho phân đoạn ${segmentIdx + 1}!`);
    } finally {
      setLoading(false);
    }
  };

  // Segment editing functions
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

  const handleEditSegmentField = (idx: number, field: keyof Segment, value: string) => {
    const newSegments = [...sessionData.script.segments];
    newSegments[idx] = { ...newSegments[idx], [field]: value };
    setSessionData((prev) => ({
      ...prev,
      script: { ...prev.script, segments: newSegments },
    }));
  };

  // Script generation and validation
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

  // Segment management
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

  // Voice generation
  const handleGenerateVoiceForSegment = async (idx: number, voiceApiType: 'f5-tts' | 'vixtts') => {
    const segment = sessionData.script.segments[idx];
    if (!segment || !segment.script || !segment.voiceName) {
      toast.error(`Phân đoạn ${idx + 1} chưa có nội dung hoặc chưa chọn giọng!`);
      return;
    }
    setLoading(true, `Đang tạo giọng đọc cho phân đoạn ${idx + 1}...`);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: segment.script,
          voiceName: segment.voiceName,
          voiceApiType: voiceApiType,
          segmentIdx: idx,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.voice_url) {
        throw new Error(data.error || 'Lỗi khi tạo giọng đọc');
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = { ...newSegments[idx], voice_url: data.voice_url, voice_path: data.voice_path, };
      setSessionData((prev) => ({
        ...prev,
        script: { ...prev.script, segments: newSegments },
      }));
      toast.success(`Đã tạo giọng đọc cho phân đoạn ${idx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo giọng đọc cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoading(false);
    }
  };

  // Final video generation
  const handleGenerateFinalVideo = async () => {
    // Check if all segments have videos and voices
    const allSegmentsReady = sessionData.script.segments.every(
      (segment) => segment.video_path && segment.voice_url
    );
    
    if (!allSegmentsReady) {
      toast.error('Tất cả các phân đoạn phải có video và giọng đọc!');
      return;
    }
    
    setLoading(true, 'Đang tạo video cuối cùng...');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/generate-final-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionData.session_id || `session_${Date.now()}`,
          segments: sessionData.script.segments,
          backgroundMusic,
          musicVolume,
        }),
      });
      
      const data = await res.json();
      if (!data.success || !data.video_url) {
        throw new Error(data.error || 'Lỗi khi tạo video cuối cùng');
      }
      
      setFinalVideoUrl(data.video_url);
      setCurrentStep(4);
      toast.success('Đã tạo video cuối cùng thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo video cuối cùng!');
    } finally {
      setLoading(false);
    }
  };

  // UI Components
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {['Thông tin cơ bản', 'Kịch bản & Video', 'Giọng đọc', 'Video cuối cùng'].map((step, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center ${idx < currentStep ? 'text-purple-600' : idx === currentStep ? 'text-purple-800' : 'text-gray-400'}`}
              style={{ width: '25%' }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  idx < currentStep
                    ? 'bg-purple-100 text-purple-600 border-2 border-purple-600'
                    : idx === currentStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}
              >
                {idx + 1}
              </div>
              <span className="text-sm text-center">{step}</span>
            </div>
          ))}
        </div>
        <div className="relative h-1 bg-gray-200 mt-4">
          <div
            className="absolute top-0 left-0 h-1 bg-purple-600"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Step 1: Basic Information Form
  const renderBasicInfoForm = () => {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="subject" className="mb-2 block">Chủ đề video</Label>
            <Input
              id="subject"
              placeholder="Nhập chủ đề video của bạn"
              value={sessionData.subject}
              onChange={(e) => syncSessionData({ subject: e.target.value })}
              className="mb-4"
            />
            
            <Label htmlFor="summary" className="mb-2 block">Tóm tắt nội dung</Label>
            <Textarea
              id="summary"
              placeholder="Mô tả ngắn gọn nội dung video của bạn"
              value={sessionData.summary}
              onChange={(e) => syncSessionData({ summary: e.target.value })}
              className="mb-4 min-h-[120px]"
            />
          </div>
          
          <div>
            <Label htmlFor="platform" className="mb-2 block">Nền tảng</Label>
            <Select
              value={sessionData.platform}
              onValueChange={(value) => syncSessionData({ platform: value })}
            >
              <SelectTrigger id="platform" className="mb-4">
                <SelectValue placeholder="Chọn nền tảng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TikTok">TikTok (9:16)</SelectItem>
                <SelectItem value="YouTube">YouTube (16:9)</SelectItem>
                <SelectItem value="Instagram">Instagram (1:1)</SelectItem>
              </SelectContent>
            </Select>
            
            <Label htmlFor="duration" className="mb-2 block">Thời lượng (giây)</Label>
            <Select
              value={sessionData.duration}
              onValueChange={(value) => syncSessionData({ duration: value })}
            >
              <SelectTrigger id="duration" className="mb-4">
                <SelectValue placeholder="Chọn thời lượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 giây</SelectItem>
                <SelectItem value="60">60 giây</SelectItem>
                <SelectItem value="90">90 giây</SelectItem>
                <SelectItem value="120">120 giây</SelectItem>
              </SelectContent>
            </Select>
            
            <Label htmlFor="style" className="mb-2 block">Phong cách</Label>
            <Select
              value={sessionData.styleSettings.style}
              onValueChange={(value) =>
                syncSessionData({
                  styleSettings: { ...sessionData.styleSettings, style: value },
                })
              }
            >
              <SelectTrigger id="style" className="mb-4">
                <SelectValue placeholder="Chọn phong cách" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleGenerateScript}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>Tạo kịch bản</>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Step 2: Script and Video Selection
  const renderScriptAndVideoSelection = () => {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Kịch bản và Chọn Video</h2>
          <p className="text-gray-600 mb-4">
            Chỉnh sửa kịch bản nếu cần và tìm kiếm video phù hợp cho từng phân đoạn.
          </p>
          
          <div className="flex justify-between mb-4">
            <Button
              onClick={() => handleAddSegment(0)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm phân đoạn đầu
            </Button>
            
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={!sessionData.script.segments.every(s => s.pexels_video_id)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Tiếp theo: Tạo giọng đọc
            </Button>
          </div>
        </div>
        
        {sessionData.script.segments.map((segment, idx) => (
          <Card key={idx} className="mb-6 overflow-hidden">
            <CardHeader className="bg-gray-50 p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Phân đoạn {idx + 1}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenSegments((prev) => {
                      const newArr = [...prev];
                      newArr[idx] = !newArr[idx];
                      return newArr;
                    })}
                  >
                    {openSegments[idx] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSegment(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className={`p-4 ${openSegments[idx] ? 'block' : 'hidden'}`}>
              {editingSegment === idx ? (
                <div className="mb-4">
                  <Label htmlFor={`script-${idx}`} className="mb-2 block">Nội dung kịch bản</Label>
                  <Textarea
                    id={`script-${idx}`}
                    value={tempInputs[`script-${idx}`] || segment.script}
                    onChange={(e) => handleTempInputChange(`script-${idx}`, e.target.value)}
                    className="mb-2 min-h-[100px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSegment(null)}
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveEditing(idx)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="mr-2 h-4 w-4" /> Lưu
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Label className="font-medium">Nội dung kịch bản</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(idx)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Sửa
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {segment.script}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-medium">Video</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(segment.script);
                      handleSearchVideos(segment.script, idx);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Search className="h-4 w-4 mr-1" /> Tìm Video
                  </Button>
                </div>
                
                {segment.pexels_thumbnail ? (
                  <div className="relative h-48 rounded-md overflow-hidden">
                    <Image
                      src={segment.pexels_thumbnail}
                      alt={`Video thumbnail for segment ${idx + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      Video đã chọn
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 rounded-md flex flex-col items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">Chưa chọn video</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="mt-4 flex justify-between">
          <Button
            onClick={() => handleAddSegment(sessionData.script.segments.length)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm phân đoạn cuối
          </Button>
          
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              Quay lại
            </Button>
            
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={!sessionData.script.segments.every(s => s.pexels_video_id)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Tiếp theo: Tạo giọng đọc
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Voice Generation
  const renderVoiceGeneration = () => {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Tạo giọng đọc</h2>
          <p className="text-gray-600 mb-4">
            Chọn giọng đọc cho từng phân đoạn và tạo giọng đọc.
          </p>
          
          <div className="mb-4">
            <Label className="mb-2 block">Loại API giọng đọc</Label>
            <div className="flex space-x-2">
              <Button
                variant={voiceApiType === 'f5-tts' ? 'default' : 'outline'}
                onClick={() => setVoiceApiType('f5-tts')}
                className={voiceApiType === 'f5-tts' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                FPT TTS
              </Button>
              <Button
                variant={voiceApiType === 'vixtts' ? 'default' : 'outline'}
                onClick={() => setVoiceApiType('vixtts')}
                className={voiceApiType === 'vixtts' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                Viettel TTS
              </Button>
            </div>
          </div>
        </div>
        
        {sessionData.script.segments.map((segment, idx) => (
          <Card key={idx} className="mb-6">
            <CardHeader className="bg-gray-50 p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Phân đoạn {idx + 1}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenSegments((prev) => {
                      const newArr = [...prev];
                      newArr[idx] = !newArr[idx];
                      return newArr;
                    })}
                  >
                    {openSegments[idx] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className={`p-4 ${openSegments[idx] ? 'block' : 'hidden'}`}>
              <div className="mb-4">
                <Label className="font-medium mb-2 block">Nội dung kịch bản</Label>
                <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {segment.script}
                </div>
              </div>
              
              <div className="mb-4">
                <Label htmlFor={`voice-${idx}`} className="font-medium mb-2 block">Chọn giọng đọc</Label>
                <Select
                  value={segment.voiceName || ''}
                  onValueChange={(value) => handleVoiceChange(idx, value)}
                >
                  <SelectTrigger id={`voice-${idx}`} className="mb-2">
                    <SelectValue placeholder="Chọn giọng đọc" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((option) => (
                      <SelectItem key={option.fileName} value={option.fileName}>
                        {option.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={() => handleGenerateVoiceForSegment(idx, voiceApiType)}
                  disabled={!segment.voiceName || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 mr-2"
                >
                  <Mic className="mr-2 h-4 w-4" /> Tạo giọng đọc
                </Button>
                
                {segment.voice_url && (
                  <div className="mt-4">
                    <Label className="font-medium mb-2 block">Nghe thử</Label>
                    <audio controls className="w-full">
                      <source src={segment.voice_url} type="audio/mpeg" />
                      Trình duyệt của bạn không hỗ trợ phát âm thanh.
                    </audio>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="mt-6 mb-4">
          <h3 className="text-lg font-semibold mb-2">Nhạc nền</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="background-music" className="mb-2 block">Chọn nhạc nền</Label>
              <Select
                value={backgroundMusic}
                onValueChange={setBackgroundMusic}
              >
                <SelectTrigger id="background-music">
                  <SelectValue placeholder="Chọn nhạc nền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có nhạc nền</SelectItem>
                  <SelectItem value="happy">Vui tươi</SelectItem>
                  <SelectItem value="relaxing">Thư giãn</SelectItem>
                  <SelectItem value="epic">Hùng tráng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="music-volume" className="mb-2 block">Âm lượng nhạc nền</Label>
              <input
                id="music-volume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(2)}
          >
            Quay lại
          </Button>
          
          <Button
            onClick={handleGenerateFinalVideo}
            disabled={
              isLoading ||
              !sessionData.script.segments.every(
                (segment) => segment.voice_url && segment.video_path
              )
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" /> Tạo video cuối cùng
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Step 4: Final Video
  const renderFinalVideo = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Video hoàn chỉnh</h2>
        
        {finalVideoUrl ? (
          <div className="mb-8">
            <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
              <video
                className="absolute top-0 left-0 w-full h-full"
                controls
                src={finalVideoUrl}
                poster="/images/video-poster.jpg"
              />
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <Button className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" /> Tải xuống
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Share2 className="mr-2 h-4 w-4" /> Chia sẻ
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Mail className="mr-2 h-4 w-4" /> Gửi qua email
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <RotateCcw className="mr-2 h-4 w-4" /> Tạo video mới
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
            <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500">Đang tải video...</p>
          </div>
        )}
      </div>
    );
  };

  // Video Search Modal
  const renderVideoSearchModal = () => {
    return (
      <Modal
        isOpen={showVideoSearch}
        onRequestClose={() => setShowVideoSearch(false)}
        contentLabel="Tìm kiếm Video"
        className="max-w-4xl mx-auto mt-20 p-6 bg-white rounded-lg shadow-xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex"
      >
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Tìm kiếm Video Pexels</h2>
            <button 
              onClick={() => setShowVideoSearch(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
          
          <div className="mb-4 flex">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              className="flex-grow mr-2"
            />
            <Button 
              onClick={() => handleSearchVideos(searchQuery, activeSegmentForSearch || 0)}
              disabled={isSearching}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Tìm Kiếm
            </Button>
          </div>
          
          {isSearching ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {searchResults.map((video) => (
                <div 
                  key={video.id}
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectVideo(video, activeSegmentForSearch || 0)}
                >
                  <div className="relative h-32">
                    <Image 
                      src={video.thumbnail}
                      alt={`Video by ${video.photographer}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                      {Math.floor(video.duration)}s
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-500 truncate">By: {video.photographer}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              {searchQuery ? 'Không tìm thấy video phù hợp' : 'Nhập từ khóa để tìm kiếm video'}
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Videos provided by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Pexels</a>
          </div>
        </div>
      </Modal>
    );
  };

  // Loading overlay
  const renderLoadingOverlay = () => {
    return isLoading && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-800">{loadingMessage || 'Đang xử lý...'}</p>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="container mx-auto p-4 pb-20">
      {renderStepIndicator()}
      
      {currentStep === 1 && renderBasicInfoForm()}
      {currentStep === 2 && renderScriptAndVideoSelection()}
      {currentStep === 3 && renderVoiceGeneration()}
      {currentStep === 4 && renderFinalVideo()}
      
      {renderVideoSearchModal()}
      {renderLoadingOverlay()}
    </div>
  );
};

export default DashboardWorkflowBasicPlus;
