"use client";

import React, { useState, useEffect, useCallback } from 'react';
import StoryboardTable from './StoryboardTable';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { ImageIcon, Mic, Video, Loader2, Edit2, Save, Play, Info, Share2, Mail, Download, RotateCcw, Search, Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Wand2 } from 'lucide-react';
import debounce from 'lodash/debounce';
import Modal from 'react-modal';
import { toAbsoluteUrl } from '../lib/toAbsoluteUrl';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import CreditCostButton from './credit/CreditCostButton';

type PexelsVideo = {
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
};

type VideoResult = {
  type: string;
  url: string;
};

type VoiceOption = {
  fileName: string;
  displayName: string;
};

type Segment = {
  script: string;
  image_description?: string;
  direct_image_url?: string;
  imageUrl?: string;
  image_base64?: string;
  voice_url?: string;
  voice_path?: string;
  voiceName?: string;
  video_path?: string;
  pexels_video_id?: number;
  pexels_video_url?: string;
  pexels_download_url?: string;
  pexels_thumbnail?: string;
  transition_effect?: string; // Hiệu ứng chuyển cảnh
};

type SessionData = {
  subject: string;
  summary: string;
  platform: string;
  duration: string;
  script: {
    title: string;
    segments: Segment[];
    platform?: string;
    platform_width?: number;
    platform_height?: number;
  };
  styleSettings: {
    style: string;
    character: string;
    scene: string;
  };
  session_id?: string;
  backgroundMusic?: string;
  musicVolume?: number;
};

const platformSizes: Record<string, { width: number; height: number }> = {
  TikTok: { width: 1080, height: 1920 }, // 9:16
  YouTube: { width: 1920, height: 1080 }, // 16:9
  Instagram: { width: 1080, height: 1080 }, // 1:1
};

const styleOptions = [
  {
    value: 'cartoon',
    label: 'Cartoon',
    description: 'Hình ảnh phong cách hoạt hình, màu sắc tươi sáng.',
    characterPlaceholder: 'Ví dụ: Nhân vật hoạt hình với mái tóc vàng, áo xanh',
    scenePlaceholder: 'Ví dụ: Phòng khách tươi sáng hoặc khu vườn cổ tích',
  },
  // ... các mục khác ...
  {
    value: 'realistic',
    label: 'Realistic',
    description: 'Hình ảnh chân thực, giống ảnh chụp thực tế.',
    characterPlaceholder: 'Ví dụ: Một người đàn ông trung niên, mặc vest, đứng trong văn phòng',
    scenePlaceholder: 'Ví dụ: Văn phòng hiện đại hoặc công viên xanh mát',
  },
];

const availableBackgroundMusics = [
  { value: 'none', label: 'Không dùng nhạc nền' },
  { value: 'Music 1.mp3', label: 'Nhạc nền 1 (Vui tươi)' },
  { value: 'Music 2.mp3', label: 'Nhạc nền 2 (Trầm lắng)' },
];

const transitionEffects = [
  { value: 'none', label: 'Không có', description: 'Chuyển cảnh trực tiếp không có hiệu ứng' },
  { value: 'fade', label: 'Mờ dần', description: 'Cảnh hiện tại mờ dần và cảnh mới hiện lên' },
  { value: 'slideLeft', label: 'Trượt trái', description: 'Cảnh mới trượt vào từ bên phải' },
  { value: 'slideRight', label: 'Trượt phải', description: 'Cảnh mới trượt vào từ bên trái' },
  { value: 'zoomIn', label: 'Phóng to', description: 'Cảnh mới phóng to từ giữa màn hình' },
  { value: 'zoomOut', label: 'Thu nhỏ', description: 'Cảnh hiện tại thu nhỏ và cảnh mới hiển thị' },
  { value: 'dissolve', label: 'Hòa tan', description: 'Cảnh hiện tại và cảnh mới hòa trộn vào nhau' }
];

const DashboardWorkflowBasicPlus = () => {
  // Modal danh sách kịch bản đã lưu
  const [showScriptList, setShowScriptList] = useState(false);
  const [savedScripts, setSavedScripts] = useState<any[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
  // Session data
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    // Cố gắng lấy dữ liệu từ localStorage nếu có
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('sessionData');
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (e) {
          console.error('Failed to parse sessionData from localStorage:', e);
        }
      }
    }
    // Dữ liệu mặc định
    return {
      subject: '',
      summary: '',
      platform: 'TikTok',
      duration: '60',
      script: {
        title: '',
        segments: [],
      },
      styleSettings: {
        style: 'cartoon',
        character: '',
        scene: '',
      },
      backgroundMusic: 'Music 1.mp3',
      musicVolume: 0.2,
    };
  });
  const [tempInputs, setTempInputs] = useState<Record<string, string>>({});
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalVideo, setModalVideo] = useState<{ url: string; type: string } | null>(null);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [openSegments, setOpenSegments] = useState<boolean[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PexelsVideo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [loadingSegments, setLoadingSegments] = useState<boolean[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  const [backgroundMusic, setBackgroundMusic] = useState<string>(sessionData.backgroundMusic ?? 'Music 1.mp3');
  const [musicVolume, setMusicVolume] = useState<number>(sessionData.musicVolume ?? 0.2);
  const [isDraggingOverTrash, setIsDraggingOverTrash] = useState<boolean>(false);
  const [voiceApiType, setVoiceApiType] = useState<'f5-tts' | 'vixtts'>('f5-tts');
  
  // Thêm các states cho việc phân tích và tìm kiếm tự động video
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [autoSearchQuery, setAutoSearchQuery] = useState<string>('');
  const [autoSearchSegmentIdx, setAutoSearchSegmentIdx] = useState<number | null>(null);

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

  // Định nghĩa hàm fetchVoices bên ngoài useEffect để có thể sử dụng ở nhiều nơi
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

  useEffect(() => {
    fetchVoices();
  }, []);

  // Step handler
  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const updateSegmentField = (idx: number, field: keyof Segment, value: string) => {
    const newSegments = [...sessionData.script.segments];
    newSegments[idx] = { ...newSegments[idx], [field]: value };
    setSessionData((prev) => ({
      ...prev,
      script: {
        ...prev.script,
        segments: newSegments,
      },
    }));
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
    updateSegmentField(idx, 'voiceName', voiceName);
  };

  const handleTransitionEffectChange = (idx: number, effect: string) => {
    updateSegmentField(idx, 'transition_effect', effect);
  };

  const setLoading = (loading: boolean, message: string = '') => {
    setIsLoading(loading);
    setLoadingMessage(message);
  };

  // Handler to generate voice for a single segment
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include', // Thêm thông tin xác thực
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
        script: {
          ...prev.script,
          segments: newSegments,
        },
      }));
      toast.success(`Đã tạo giọng đọc cho phân đoạn ${idx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo giọng đọc cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tạo giọng đọc cho phân đoạn
  const handleGenerateVoice = async (idx: number) => {
    const segment = sessionData.script.segments[idx];
    if (!segment.script) {
      toast.error('Phân đoạn không có nội dung để tạo giọng đọc');
      return;
    }
    
    if (!segment.voiceName) {
      toast.error('Vui lòng chọn giọng đọc trước khi tạo');
      return;
    }
    
    setLoading(true, `Đang tạo giọng đọc cho phân đoạn ${idx + 1}...`);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include', // Thêm thông tin xác thực
        body: JSON.stringify({
          text: segment.script,
          segmentIdx: idx,
          voiceName: segment.voiceName,
          voiceApiType: voiceApiType,
          language: 'vi',
          normalizeText: true,
          speed: 1
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Lỗi khi tạo giọng đọc');
      }
      
      const data = await res.json();
      
      if (!data.success || !data.voice_url) {
        throw new Error(data.error || 'Không nhận được file giọng đọc');
      }
      
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = {
        ...newSegments[idx],
        voice_url: data.voice_url,
        voice_path: data.voice_path
      };
      
      setSessionData({
        ...sessionData,
        script: {
          ...sessionData.script,
          segments: newSegments
        }
      });
      
      toast.success(`Đã tạo giọng đọc cho phân đoạn ${idx + 1}`);
    } catch (error: any) {
      console.error('Lỗi khi tạo giọng đọc:', error);
      toast.error(error.message || 'Lỗi khi tạo giọng đọc');
    } finally {
      setLoading(false);
    }
  };

  // Handler to add a new segment
  const handleAddSegment = (insertIdx: number) => {
    setSessionData((prev) => {
      const newSegments = [...prev.script.segments];
      newSegments.splice(insertIdx, 0, { script: '' });
      return {
        ...prev,
        script: {
          ...prev.script,
          segments: newSegments,
        },
      };
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
    setOpenSegments((prev) => prev.filter((_, idx) => idx !== removeIdx));
  };

  // Tìm kiếm video từ Pexels - chức năng riêng của Basic+
  const handleSearchPexelsVideos = async () => {
    if (!searchQuery) {
      toast.error('Vui lòng nhập từ khóa tìm kiếm!');
      return;
    }
    
    // Sử dụng hàm handleSearchPexelsVideosWithQuery với query từ state
    await handleSearchPexelsVideosWithQuery(searchQuery, selectedSegmentIndex || 0);
  };

  // Hàm tìm kiếm video Pexels với từ khóa cụ thể
  const handleSearchPexelsVideosWithQuery = async (query: string, segmentIdx: number | null = null) => {
    if (!query.trim()) {
      toast.error('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Sử dụng URLSearchParams để tạo query string
      const params = new URLSearchParams({
        query,
        per_page: '8', // Giới hạn số lượng kết quả
      });

      const response = await fetch(`/api/search-pexels-videos?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Lỗi khi tìm kiếm video');
      }

      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.videos && Array.isArray(data.videos)) {
        // Chuyển đổi kết quả về định dạng PexelsVideo
        const formattedResults: PexelsVideo[] = data.videos.map((video: any) => ({
          id: video.id,
          thumbnail: video.thumbnail,
          duration: video.duration,
          previewUrl: video.previewUrl || '',
          downloadUrl: video.downloadUrl || '',
          pexelsUrl: video.pexelsUrl,
          photographer: video.photographer,
          photographerUrl: video.photographerUrl,
          width: video.width,
          height: video.height,
        }));
        
        console.log('Videos found:', data.videos.length);
        
        setSearchResults(formattedResults);
        
        // Nếu tìm thấy kết quả, tự động chọn video đầu tiên nếu đang phân tích tự động
        if (formattedResults.length > 0 && isAnalyzingContent) {
          setTimeout(() => {
            handleSelectPexelsVideo(segmentIdx!, formattedResults[0]);
          }, 500);
        }
      } else {
        throw new Error(data.error || 'Không tìm thấy video phù hợp');
      }
    } catch (error: any) {
      console.error('Lỗi khi tìm kiếm video:', error);
      toast.error(error.message || 'Lỗi khi tìm kiếm video!');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Hàm chọn video Pexels cho phân đoạn
  const handleSelectPexelsVideo = (segmentIdx: number, video: PexelsVideo) => {
    // Nếu không có phân đoạn đang chọn, hiển thị lỗi
    if (segmentIdx === null) {
      toast.error('Vui lòng chọn phân đoạn trước khi chọn video!');
      return;
    }

    // Cập nhật thông tin video cho phân đoạn được chọn
    const newSegments = [...sessionData.script.segments];
    newSegments[segmentIdx] = {
      ...newSegments[segmentIdx],
      pexels_video_id: video.id,
      pexels_video_url: video.previewUrl,
      pexels_download_url: video.downloadUrl,
      pexels_thumbnail: video.thumbnail,
    };

    setSessionData((prev) => ({
      ...prev,
      script: {
        ...prev.script,
        segments: newSegments,
      },
    }));

    // Đóng modal
    setModalIsOpen(false);
    toast.success(`Đã chọn video cho phân đoạn ${segmentIdx + 1}`);

    // Tự động tạo giọng đọc nếu chưa có
    if (!newSegments[segmentIdx].voice_url && newSegments[segmentIdx].voiceName) {
      handleGenerateVoiceForSegment(segmentIdx, voiceApiType);
    }
  };

  // Tạo video từ video Pexels và audio - chức năng riêng của Basic+
  const handleCreateSegmentVideoFromPexels = async (idx: number) => {
    const segment = sessionData.script.segments[idx];
    if (!segment.pexels_download_url) {
      toast.error(`Phân đoạn ${idx + 1} chưa chọn video!`);
      return;
    }
    
    if (!segment.voice_url && !segment.voice_path) {
      toast.error(`Phân đoạn ${idx + 1} chưa có giọng đọc!`);
      return;
    }
    
    setLoading(true, `Đang tạo video cho phân đoạn ${idx + 1}...`);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const sessionId = sessionData.session_id || 'temp-session-' + Date.now();
      
      // Bước 1: Tải video Pexels
      const downloadRes = await fetch('/api/download-pexels-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          downloadUrl: segment.pexels_download_url,
          sessionId: sessionId,
          segmentIndex: idx
        }),
      });
      
      if (!downloadRes.ok) {
        const errorData = await downloadRes.json();
        throw new Error(errorData.error || 'Lỗi khi tải video từ Pexels');
      }
      
      const downloadData = await downloadRes.json();
      
      if (!downloadData.success || (!downloadData.video_path && !downloadData.public_url)) {
        console.error('Download API response:', downloadData);
        throw new Error(downloadData.error || 'Không nhận được đường dẫn video');
      }
      
      // Bước 2: Ghép video với giọng đọc
      const mergeRes = await fetch('/api/merge-video-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          // Đảm bảo đường dẫn tương đối (public_url) được ưu tiên sử dụng
          // và bỏ đi phần đường dẫn tuyệt đối nếu có
          videoUrl: downloadData.public_url || (downloadData.video_path ? downloadData.video_path.split('public').pop() : null),
          voiceUrl: segment.voice_url || segment.voice_path,
          segmentIdx: idx,
        }),
      });
      
      if (!mergeRes.ok) {
        const errorData = await mergeRes.json();
        throw new Error(errorData.error || 'Lỗi khi ghép video và giọng đọc');
      }
      
      const mergeData = await mergeRes.json();
      
      if (!mergeData.success || !mergeData.videoUrl) {
        throw new Error(mergeData.error || 'Không nhận được video ghép');
      }
      
      const videoUrl = mergeData.videoUrl;
      
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = {
        ...newSegments[idx],
        video_path: videoUrl
      };
      
      const newSessionData = {
        ...sessionData,
        script: {
          ...sessionData.script,
          segments: newSegments
        }
      };
      
      setSessionData(newSessionData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sessionData', JSON.stringify(newSessionData));
      }
      
      toast.success(`Đã tạo video cho phân đoạn ${idx + 1} thành công!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo video cho phân đoạn ${idx + 1}`);
      console.error('Error creating video:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm phân tích nội dung kịch bản bằng mô hình ngôn ngữ lớn để tìm từ khóa phù hợp
  const analyzeSegmentContent = async (idx: number) => {
    const segment = sessionData.script.segments[idx];
    
    if (!segment.script) {
      toast.error('Phân đoạn không có nội dung để phân tích');
      return;
    }
    
    setIsAnalyzingContent(true);
    
    try {
      // Gọi API để phân tích nội dung và đề xuất từ khóa tìm kiếm
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Thêm thông tin xác thực
        body: JSON.stringify({
          content: segment.script,
          purpose: 'video_search',
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi gọi API tạo kịch bản');
      }

      const data = await response.json();
      
      console.log('Analyze content response:', data);
      
      if (data.success && data.keywords && data.keywords.length > 0) {
        // Lấy từ khóa đề xuất
        const suggestedKeywords = data.keywords;
        
        // Kết hợp các từ khóa để tạo truy vấn tìm kiếm
        const searchTerms = suggestedKeywords.join(' ');
        
        setAutoSearchQuery(searchTerms);
        console.log('Searching with keywords:', searchTerms);
        
        // Tự động tìm kiếm video với từ khóa đề xuất
        await handleSearchPexelsVideosWithQuery(searchTerms, idx);
        
        toast.success(`Đã phân tích nội dung và tìm kiếm video cho phân đoạn ${idx + 1}`);
      } else {
        // Sử dụng từ khóa dự phòng từ 2-3 từ đầu tiên của nội dung
        console.warn('Không nhận được từ khóa, sử dụng từ khóa dự phòng');
        const fallbackQuery = segment.script.split(' ').slice(0, 3).join(' ');
        setAutoSearchQuery(fallbackQuery);
        await handleSearchPexelsVideosWithQuery(fallbackQuery, idx);
      }
    } catch (error: any) {
      console.error('Lỗi khi phân tích nội dung:', error);
      toast.error(error.message || 'Lỗi khi phân tích nội dung!');
      
      // Nếu lỗi, dùng 3 từ đầu tiên của nội dung làm từ khóa tìm kiếm
      const fallbackQuery = segment.script.split(' ').slice(0, 3).join(' ');
      console.warn('Sử dụng từ khóa dự phòng:', fallbackQuery);
      setAutoSearchQuery(fallbackQuery);
      await handleSearchPexelsVideosWithQuery(fallbackQuery, idx);
    } finally {
      setIsAnalyzingContent(false);
    }
  };

  // Tạo tất cả video từ Pexels - chức năng riêng của Basic+
  const handleCreateAllVideosFromPexels = async () => {
    const segments = sessionData.script.segments;
    const missingPexelsSegments = segments.filter((seg, idx) => !seg.pexels_download_url).map((_,idx) => idx + 1);
    
    if (missingPexelsSegments.length > 0) {
      toast.error(`Vui lòng chọn video Pexels cho tất cả phân đoạn (còn thiếu phân đoạn: ${missingPexelsSegments.join(', ')})`);
      return;
    }
    
    const missingVoiceSegments = segments.filter((seg, idx) => !seg.voice_url && !seg.voice_path).map((_,idx) => idx + 1);
    
    if (missingVoiceSegments.length > 0) {
      toast.error(`Vui lòng tạo giọng đọc cho tất cả phân đoạn (còn thiếu phân đoạn: ${missingVoiceSegments.join(', ')})`);
      return;
    }
    
    setLoading(true, 'Đang tạo tất cả video...');
    
    try {
      for (let idx = 0; idx < segments.length; idx++) {
        const seg = segments[idx];
        if (!seg.video_path) {
          await handleCreateSegmentVideoFromPexels(idx);
        }
      }
      toast.success('Đã tạo tất cả video!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo video!');
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm để tạo video cho tất cả các phân đoạn tự động
  const handleAutomateVideoCreation = async () => {
    if (!sessionData.script.segments.length) {
      toast.success('Không có phân đoạn nào để tạo video!');
      return;
    }

    setIsLoading(true);
    toast.success('Bắt đầu tạo video cho tất cả phân đoạn...');

    try {
      // Tạo video lần lượt cho từng phân đoạn
      for (let i = 0; i < sessionData.script.segments.length; i++) {
        // Phân tích nội dung để tìm video Pexels
        await analyzeSegmentContent(i);
        // Đợi một chút trước khi xử lý phân đoạn tiếp theo
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.success('Đã tạo video cho tất cả phân đoạn!');
    } catch (error: any) {
      console.error('Lỗi khi tạo video tự động:', error);
      toast.error(error.message || 'Lỗi khi tạo video tự động!');
    } finally {
      setIsLoading(false);
    }
  };

  // Ghép tất cả các video phân đoạn thành video hoàn chỉnh
  const handleConcatVideos = async () => {
    console.log('handleConcatVideos được gọi');
    
    const videoFiles = sessionData.script.segments
      .map((seg) => seg.video_path)
      .filter((v): v is string => !!v);
      
    console.log('Danh sách video đã lọc:', videoFiles);
      
    // Kiểm tra số lượng video có sẵn để ghép
    if (!videoFiles.length) {
      console.log('Không có video nào để ghép');
      toast.error('Chưa có video phân đoạn nào để ghép! Vui lòng tạo video cho ít nhất một phân đoạn trước.');
      return;
    }
    
    console.log('Video files to concat:', videoFiles);
    setLoading(true, 'Đang ghép video tổng...');
    
    try {
      // Đảm bảo đường dẫn video đúng định dạng
      // API concat-videos-with-music yêu cầu đường dẫn tương đối với /public thay vì đường dẫn tuyệt đối
      const formattedVideoFiles = videoFiles.map(path => {
        // Nếu path đã là relative path (bắt đầu bằng /), giữ nguyên
        if (path.startsWith('/')) return path;
        // Nếu path là absolute path, chuyển thành relative path
        return `/${path}`;
      });
      
      const payload: any = {
        videoFiles: formattedVideoFiles,
        musicFile: backgroundMusic, // Sử dụng file nhạc đã chọn
        musicVolume,
        platform: sessionData.platform,
        transitionEffects: sessionData.script.segments.map(seg => seg.transition_effect || 'none')
      };
      
      console.log('Concat videos payload:', payload);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/concat-videos-with-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include', // Thêm thông tin xác thực
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Lỗi khi ghép video (${res.status})`);
      }
      
      const data = await res.json();
      
      if (!data.success || !data.videoUrl) {
        throw new Error(data.error || 'Lỗi khi ghép video');
      }
      
      setFinalVideoUrl(data.videoUrl);
      setCurrentStep(4);
      toast.success('Đã ghép video thành công!');
    } catch (err: any) {
      console.error('Error concatenating videos:', err);
      toast.error(err.message || 'Lỗi khi ghép video!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý tạo kịch bản
  const handleGenerateScript = async () => {
    if (!sessionData.subject) {
      toast.error('Vui lòng nhập chủ đề video!');
      return;
    }

    setIsGeneratingScript(true);
    const platformSize = platformSizes[sessionData.platform] || { width: 1280, height: 720 };

    try {
      // Gọi API để tạo kịch bản
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Thêm thông tin xác thực
        body: JSON.stringify({
          subject: sessionData.subject,
          summary: sessionData.summary,
          platform: sessionData.platform,
          duration: sessionData.duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi gọi API tạo kịch bản');
      }

      const data = await response.json();
      
      if (data.success && data.script) {
        // Cập nhật state với kịch bản đã tạo
        setSessionData((prev) => ({
          ...prev,
          script: {
            ...data.script,
            platform: prev.platform,
            platform_width: platformSize.width,
            platform_height: platformSize.height,
          },
          session_id: data.session_id || prev.session_id,
        }));

        // Chuyển đến bước 3 (Storyboard) sau khi tạo kịch bản
        setCurrentStep(3);
        toast.success('Đã tạo kịch bản thành công!');
      } else {
        throw new Error(data.error || 'Không thể tạo kịch bản');
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo kịch bản:', error);
      toast.error(error.message || 'Lỗi khi tạo kịch bản!');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Hàm xử lý thay đổi nhạc nền
  const handleBackgroundMusicChange = (value: string) => {
    setBackgroundMusic(value);
    // Lưu lại vào localStorage
    if (typeof window !== 'undefined') {
      const storedData = JSON.parse(localStorage.getItem('sessionData') || '{}');
      localStorage.setItem('sessionData', JSON.stringify({
        ...storedData,
        backgroundMusic: value
      }));
    }
  };

  // Hàm xử lý thay đổi âm lượng nhạc nền
  const handleMusicVolumeChange = (value: number) => {
    setMusicVolume(value);
    // Lưu lại vào localStorage
    if (typeof window !== 'undefined') {
      const storedData = JSON.parse(localStorage.getItem('sessionData') || '{}');
      localStorage.setItem('sessionData', JSON.stringify({
        ...storedData,
        musicVolume: value
      }));
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl bg-white/70 backdrop-blur-sm rounded-lg">
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg mr-3 text-2xl">
            🟡
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Luồng Basic+ - Tạo Video Nâng Cao</h1>
        </div>
        <p className="text-gray-600 max-w-2xl">
          Luồng Basic+ mang đến các công cụ chỉnh sửa nâng cao hơn, giúp bạn tạo video chuyên nghiệp với nhiều tùy chỉnh sáng tạo hơn so với gói Basic.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2 justify-center md:justify-between items-center">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-yellow-500 text-white' 
                    : currentStep > step 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step ? '✓' : step}
              </div>
              <span
                className={`hidden md:inline text-sm ${
                  currentStep === step 
                    ? 'text-yellow-600 font-medium' 
                    : currentStep > step 
                      ? 'text-green-600' 
                      : 'text-gray-500'
                }`}
              >
                {step === 1 && 'Ý tưởng'}
                {step === 2 && 'Kịch bản'}
                {step === 3 && 'Storyboard'}
                {step === 4 && 'Hoàn tất'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bước 1: Nhập ý tưởng video của bạn</h2>
          <p className="text-gray-600 mb-6">Hãy cung cấp ý tưởng chính hoặc chủ đề cho video của bạn. AI sẽ giúp bạn tạo kịch bản phù hợp.</p>
          
          <div className="grid grid-cols-1 gap-5 mb-6">
            <div>
              <Label htmlFor="subject" className="block mb-2 font-medium text-gray-700">Chủ đề chính</Label>
              <Input
                id="subject"
                placeholder="Ví dụ: Review sản phẩm công nghệ, Chia sẻ mẹo du lịch..."
                value={sessionData.subject}
                onChange={(e) => setSessionData((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full"
              />
              
              <Label htmlFor="summary" className="block mt-4 mb-2 font-medium text-gray-700">Tóm tắt nội dung</Label>
              <Textarea
                id="summary"
                placeholder="Mô tả thêm về nội dung video bạn muốn tạo..."
                value={sessionData.summary}
                onChange={(e) => setSessionData((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full h-24"
              />
            </div>
            
            <div>
              <Label htmlFor="platform" className="block mb-2 font-medium text-gray-700">Nền tảng</Label>
              <Select
                value={sessionData.platform}
                onValueChange={(value) => setSessionData((prev) => ({ ...prev, platform: value }))}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Chọn nền tảng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TikTok">TikTok (9:16)</SelectItem>
                  <SelectItem value="YouTube">YouTube (16:9)</SelectItem>
                  <SelectItem value="Instagram">Instagram (1:1)</SelectItem>
                </SelectContent>
              </Select>
              
              <Label htmlFor="duration" className="block mt-4 mb-2 font-medium text-gray-700">Thời lượng (giây)</Label>
              <Select
                value={sessionData.duration}
                onValueChange={(value) => setSessionData((prev) => ({ ...prev, duration: value }))}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Chọn thới lượng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 giây</SelectItem>
                  <SelectItem value="60">60 giây</SelectItem>
                  <SelectItem value="90">90 giây</SelectItem>
                  <SelectItem value="120">120 giây</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <CreditCostButton
              apiName="generate_script"
              onClick={handleGenerateScript}
              disabled={!sessionData.subject || isGeneratingScript}
              size="lg"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo kịch bản...
                </>
              ) : (
                "Tạo kịch bản"
              )}
            </CreditCostButton>
          </div>
        </motion.div>
      )}
      
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bước 3: Storyboard - Tùy chỉnh nâng cao (Basic+)</h2>
          <p className="text-gray-600 mb-6">Tùy chỉnh chi tiết từng đoạn video với video stock từ Pexels và các hiệu ứng đặc biệt.</p>
          
          {/* Thêm giao diện tìm kiếm video Pexels - Đặc trưng của Basic+ */}
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium text-yellow-700 mb-2 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Tìm cảnh quay phù hợp
            </h3>
            <p className="text-sm text-yellow-600 mb-4">
              Tìm kiếm video chất lượng cao từ thư viện Pexels để làm phong phú video của bạn. 
              Chọn phân đoạn trước khi tìm kiếm để áp dụng video.
            </p>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select
                value={String(selectedSegmentIndex !== null ? selectedSegmentIndex + 1 : '')}
                onValueChange={(value) => setSelectedSegmentIndex(parseInt(value) - 1)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn phân đoạn" />
                </SelectTrigger>
                <SelectContent>
                  {sessionData.script.segments.map((_, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>
                      Phân đoạn {idx + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CreditCostButton
                apiName="search_pexels_videos"
                onClick={handleSearchPexelsVideos}
                disabled={isSearching || !searchQuery}
                size="lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tìm...
                  </>
                ) : (
                  "Tìm kiếm"
                )}
              </CreditCostButton>
            </div>
            
            {/* Hiển thị kết quả tìm kiếm */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Kết quả tìm kiếm ({searchResults.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {searchResults.map((video) => (
                    <div
                      key={video.id}
                      className="border rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectPexelsVideo(selectedSegmentIndex!, video)}
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={video.thumbnail}
                          alt={`Video by ${video.photographer}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-cover"
                        />
                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1">
                          {Math.floor(video.duration)}s
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-500 truncate">By {video.photographer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Bảng hiển thị storyboard */}
          <div className="mb-6 border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left w-16">STT</th>
                  <th className="border px-4 py-2 text-left">Kịch bản</th>
                  <th className="border px-4 py-2 text-left">Hình ảnh</th>
                  <th className="border px-4 py-2 text-left">Lồng tiếng</th>
                  <th className="border px-4 py-2 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessionData.script.segments.length > 0 ? (
                  sessionData.script.segments.map((segment, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="max-h-32 overflow-y-auto">
                          {editingSegment === idx ? (
                            <div className="flex flex-col gap-2">
                              <Textarea
                                value={tempInputs[`script-${idx}`] || segment.script}
                                onChange={(e) => handleTempInputChange(`script-${idx}`, e.target.value)}
                                className="w-full h-24"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSegment(null)}
                                  className="text-xs p-1"
                                >
                                  Hủy
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveEditing(idx)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs p-1"
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Lưu
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <p>{segment.script}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(idx)}
                                className="self-start text-xs p-1"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Sửa
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          {/* Hiển thị video Pexels (nếu có) */}
                          {segment.pexels_thumbnail ? (
                            <div className="relative w-32 h-20 rounded overflow-hidden border border-gray-200 group">
                              <Image
                                src={segment.pexels_thumbnail}
                                alt={`Video cho phân đoạn ${idx + 1}`}
                                fill
                                sizes="128px"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={() => setModalVideo({ url: segment.pexels_video_url || '', type: 'video/mp4' })}
                                  className="p-1 bg-white rounded-full"
                                >
                                  <Play className="w-4 h-4 text-gray-800" />
                                </button>
                              </div>
                            </div>
                          ) : segment.direct_image_url ? (
                            <div className="relative w-32 h-20 rounded overflow-hidden border border-gray-200">
                              <Image
                                src={segment.direct_image_url}
                                alt={`Ảnh cho phân đoạn ${idx + 1}`}
                                fill
                                sizes="128px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSegmentIndex(idx);
                                  setModalIsOpen(true);
                                }}
                                className="text-xs"
                              >
                                <Video className="w-3 h-3 mr-1" />
                                Chọn cảnh quay
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => analyzeSegmentContent(idx)}
                                className="text-xs"
                                disabled={isAnalyzingContent && autoSearchSegmentIdx === idx}
                              >
                                {isAnalyzingContent && autoSearchSegmentIdx === idx ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Đang phân tích...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Tìm cảnh quay phù hợp
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <Select
                            value={segment.voiceName || ""}
                            onValueChange={(value) => handleVoiceChange(idx, value)}
                          >
                            <SelectTrigger className="w-36 text-xs">
                              <SelectValue placeholder="Chọn giọng đọc" />
                            </SelectTrigger>
                            <SelectContent>
                              {voiceOptions.map((voice) => (
                                <SelectItem key={voice.fileName} value={voice.fileName}>
                                  {voice.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {segment.voiceName && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">TTS:</span>
                              <Select
                                value={voiceApiType}
                                onValueChange={(value) => setVoiceApiType(value as 'f5-tts' | 'vixtts')}
                              >
                                <SelectTrigger className="h-7 py-0 px-2 text-xs w-24">
                                  <SelectValue placeholder="Chọn API" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="f5-tts">F5-TTS</SelectItem>
                                  <SelectItem value="vixtts">VixTTS</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {segment.voiceName && (
                            <CreditCostButton
                              apiName="generate_voice"
                              onClick={() => handleGenerateVoice(idx)}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              disabled={isLoading}
                            >
                              <Mic className="w-3 h-3 mr-1" />
                              Tạo giọng đọc
                            </CreditCostButton>
                          )}
                          
                          {segment.voice_url && (
                            <audio
                              src={segment.voice_url}
                              controls
                              className="w-full h-8 mt-1"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          {(segment.pexels_download_url && segment.voice_url) && (
                            <CreditCostButton
                              apiName="merge_video_voice"
                              onClick={() => handleCreateSegmentVideoFromPexels(idx)}
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                              disabled={isLoading}
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Dựng phân cảnh
                            </CreditCostButton>
                          )}
                          
                          {segment.video_path && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setModalVideo({ url: segment.video_path || '', type: 'video/mp4' })}
                              className="text-xs"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Xem phân cảnh
                            </Button>
                          )}
                          
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddSegment(idx + 1)}
                              className="p-1"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveSegment(idx)}
                              className="text-red-500 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Select
                            value={segment.transition_effect || ""}
                            onValueChange={(value) => handleTransitionEffectChange(idx, value)}
                          >
                            <SelectTrigger className="w-36 text-xs">
                              <SelectValue placeholder="Chọn hiệu ứng chuyển cảnh" />
                            </SelectTrigger>
                            <SelectContent>
                              {transitionEffects.map((effect) => (
                                <SelectItem key={effect.value} value={effect.value}>
                                  <div className="flex flex-col">
                                    <span>{effect.label}</span>
                                    <span className="text-xs text-gray-500">{effect.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-gray-500 mb-4">Chưa có phân đoạn nào. Hãy tạo kịch bản từ ý tưởng của bạn.</p>
                        <Button
                          onClick={() => handleAddSegment(0)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Thêm phân đoạn
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Phần hiệu ứng chuyển cảnh */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Hiệu ứng chuyển cảnh (Transitions)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessionData.script.segments.map((segment, idx) => (
                idx > 0 ? (
                  <div key={idx} className="border rounded-md p-3 bg-white hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Phân đoạn {idx}</h4>
                      <span className="text-xs text-gray-500">→</span>
                      <h4 className="font-medium text-sm">Phân đoạn {idx + 1}</h4>
                    </div>
                    <Select
                      value={segment.transition_effect || "none"}
                      onValueChange={(value) => handleTransitionEffectChange(idx, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn hiệu ứng chuyển cảnh" />
                      </SelectTrigger>
                      <SelectContent>
                        {transitionEffects.map((effect) => (
                          <SelectItem key={effect.value} value={effect.value}>
                            <div className="flex flex-col">
                              <span>{effect.label}</span>
                              <span className="text-xs text-gray-500">{effect.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null
              ))}
            </div>
          </div>
          
          {/* Thiết lập nhạc nền */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nhạc nền (Soundtrack)</h3>
            <div className="flex flex-wrap gap-4">
              <Select
                value={backgroundMusic}
                onValueChange={handleBackgroundMusicChange}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Chọn nhạc nền" />
                </SelectTrigger>
                <SelectContent>
                  {availableBackgroundMusics.map((music) => (
                    <SelectItem key={music.value} value={music.value}>
                      {music.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Âm lượng:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">{Math.round(musicVolume * 100)}%</span>
              </div>
            </div>
          </div>
          
          {/* Thêm nút để tạo video tự động cho tất cả các phân đoạn */}
          <div className="mb-4 flex justify-end">
            <CreditCostButton
              apiName="create_all_videos"
              onClick={handleAutomateVideoCreation}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Tự động dựng tất cả phân cảnh
                </>
              )}
            </CreditCostButton>
          </div>
          
          <div className="flex justify-between gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="border-gray-500 text-gray-600 hover:bg-gray-50"
            >
              Quay lại
            </Button>
            <div className="flex gap-2">
              <CreditCostButton
                apiName="concat_videos"
                onClick={() => {
                  console.log('Button Kết xuất tác phẩm hoàn chỉnh được nhấn');
                  handleConcatVideos();
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Kết xuất tác phẩm hoàn chỉnh
                  </>
                )}
              </CreditCostButton>
              <CreditCostButton
                apiName="create_all_videos"
                onClick={handleCreateAllVideosFromPexels}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Dựng tất cả phân cảnh
                  </>
                )}
              </CreditCostButton>
            </div>
          </div>
          
          {/* Modal xem video */}
          <Modal
            isOpen={!!modalVideo}
            onRequestClose={() => setModalVideo(null)}
            className="max-w-2xl mx-auto mt-20 p-6 bg-white rounded-lg shadow-xl"
            overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center"
          >
            {modalVideo && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Xem trước video</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setModalVideo(null)}
                    className="p-1"
                  >
                    &times;
                  </Button>
                </div>
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <video
                    src={modalVideo.url}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </Modal>
          
          {/* Modal tìm kiếm video Pexels */}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            className="max-w-4xl mx-auto mt-20 p-6 bg-white rounded-lg shadow-xl overflow-y-auto max-h-[80vh]"
            overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {selectedSegmentIndex !== null
                    ? `Chọn cảnh quay cho phân đoạn ${selectedSegmentIndex + 1}`
                    : 'Chọn cảnh quay'}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setModalIsOpen(false)}
                  className="p-1"
                >
                  &times;
                </Button>
              </div>
              
              <div className="flex gap-3 mb-4">
                <Input
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <CreditCostButton
                  apiName="search_pexels_videos"
                  onClick={handleSearchPexelsVideos}
                  disabled={isSearching || !searchQuery}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tìm...
                    </>
                  ) : (
                    "Tìm kiếm"
                  )}
                </CreditCostButton>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Kết quả tìm kiếm ({searchResults.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {searchResults.map((video) => (
                      <div
                        key={video.id}
                        className="border rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleSelectPexelsVideo(selectedSegmentIndex!, video)}
                      >
                        <div className="relative aspect-video">
                          <Image
                            src={video.thumbnail}
                            alt={`Video by ${video.photographer}`}
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                          <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1">
                            {Math.floor(video.duration)}s
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-500 truncate">By {video.photographer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </motion.div>
      )}
      
      {currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bước 4: Hoàn tất</h2>
          <p className="text-gray-600 mb-6">Video của bạn đã được tạo. Xem, tải xuống hoặc chia sẻ ngay bây giờ.</p>
          
          {/* Video completed section */}
          {finalVideoUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 bg-green-50 p-6 rounded-lg border border-green-100"
            >
              <div className="flex items-center text-green-700 mb-3">
                <Video className="w-6 h-6 mr-2" />
                <h3 className="text-xl font-semibold">Video của bạn đã sẵn sàng!</h3>
              </div>
              
              <p className="text-gray-700 mb-5">
                Video đã được tạo thành công. Bạn có thể xem hoặc tải xuống ngay bây giờ.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <Button
                  asChild
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <a href={finalVideoUrl} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-2" />
                    Xem Video
                  </a>
                </Button>
                
                <Button
                  asChild
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <a href={finalVideoUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Tải Xuống
                  </a>
                </Button>
                
                <Button
                  variant="outline"
                  className="border-gray-500 text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    navigator.clipboard.writeText(finalVideoUrl);
                    toast.success("Đã sao chép đường dẫn vào clipboard");
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Sao Chép Link
                </Button>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-600 mb-5">
                Video sẽ được lưu trữ trong 24 giờ. Hãy tải xuống hoặc chia sẻ trước khi hết hạn.
              </div>
              
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  onClick={() => {
                    // Clear all data and return to workflow selection
                    setVideoResults([]);
                    setSessionData({
                      subject: '',
                      summary: '',
                      platform: 'TikTok',
                      duration: '60',
                      script: { title: '', segments: [] },
                      styleSettings: {
                        style: 'cartoon',
                        character: '',
                        scene: '',
                      },
                      backgroundMusic: 'Music 1.mp3',
                      musicVolume: 0.2,
                    });
                    setCurrentStep(1);
                    // Navigate to workflow selection
                    window.location.href = '/dashboard/workflows';
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tạo Video Mới
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardWorkflowBasicPlus;
