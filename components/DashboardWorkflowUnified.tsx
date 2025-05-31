import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Play, Pause, Image, Video, Plus, Minus, Check, X, ChevronDown, ChevronUp, Settings, Save, Upload } from 'lucide-react';
import { useStoryboardWorkflow, Segment, Script, VoiceOption } from './useStoryboardWorkflow';

interface DashboardWorkflowUnifiedProps {
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
  branding: 'basic' | 'basic-plus' | 'premium';
}

const BRANDING_CONFIG = {
  'basic': {
    bg: 'from-green-50 to-blue-50',
    title: 'Storyboard Basic',
    color: 'green',
    ring: 'focus:ring-green-500',
    button: 'bg-green-500 hover:bg-green-600',
    accent: 'green',
    maxSegments: 5,
    features: ['Tạo kịch bản', 'Tạo giọng đọc', 'Tạo hình ảnh']
  },
  'basic-plus': {
    bg: 'from-blue-50 to-purple-50',
    title: 'Storyboard Basic Plus',
    color: 'blue',
    ring: 'focus:ring-blue-500',
    button: 'bg-blue-500 hover:bg-blue-600',
    accent: 'blue',
    maxSegments: 10,
    features: ['Tạo kịch bản', 'Tạo giọng đọc', 'Tạo hình ảnh', 'Thêm/xóa phân đoạn']
  },
  'premium': {
    bg: 'from-purple-50 to-pink-50',
    title: 'Storyboard Premium',
    color: 'purple',
    ring: 'focus:ring-purple-500',
    button: 'bg-purple-500 hover:bg-purple-600',
    accent: 'purple',
    maxSegments: 20,
    features: ['Tạo kịch bản', 'Tạo giọng đọc', 'Tạo hình ảnh', 'Thêm/xóa phân đoạn', 'Tạo video']
  }
};

const DashboardWorkflowUnified: React.FC<DashboardWorkflowUnifiedProps> = ({
  script,
  voiceOptions,
  voiceApiType,
  onVoiceChange,
  onGenerateVoiceForSegment,
  onEditImageDesc,
  onGenerateImageForSegment,
  onConfirm,
  onCreateSegmentVideo,
  onAddSegment,
  onRemoveSegment,
  branding,
}) => {
  const config = BRANDING_CONFIG[branding];
  
  // State for script form
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [duration, setDuration] = useState(60);
  const [platform, setPlatform] = useState('TikTok');
  const [style, setStyle] = useState('');
  
  // State for script generation
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptSubmitted, setIsScriptSubmitted] = useState(false);
  const [localScript, setLocalScript] = useState<Script | undefined>(script);
  
  // State for audio playback
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [currentlyPlayingIdx, setCurrentlyPlayingIdx] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State for expanded segments
  const [expandedSegments, setExpandedSegments] = useState<Record<number, boolean>>({});
  
  // Loading states for individual segments
  const [loadingStates, setLoadingStates] = useState<Record<number, { voice?: boolean; image?: boolean; video?: boolean }>>({});
  
  useEffect(() => {
    if (script) {
      setLocalScript(script);
    }
  }, [script]);
  
  // Lấy danh sách giọng đọc local khi component được tải

  
  useEffect(() => {
    // Cleanup audio and interval on unmount
    return () => {
      if (playingAudio) {
        playingAudio.pause();
        setPlayingAudio(null);
        setCurrentlyPlayingIdx(null);
      }
      clearProgressInterval();
    };
  }, [playingAudio]);

  const handleScriptSubmit = async () => {
    if (!subject.trim()) {
      alert('Vui lòng nhập chủ đề video');
      return;
    }
    
    if (!summary.trim()) {
      alert('Vui lòng nhập tóm tắt nội dung');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Gọi API generate-script với dữ liệu:', {
        subject,
        summary,
        duration,
        platform,
        style,
        workflow: branding
      });
      
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          summary,
          duration,
          platform,
          style: style || undefined, // Chỉ gửi nếu có giá trị
          workflow: branding, // Gửi thông tin luồng để API xử lý phù hợp
        }),
      });
      
      // Kiểm tra và xử lý lỗi HTTP
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Lỗi HTTP ${response.status}: ${response.statusText}`;
        
        // Chỉ parse JSON nếu response là JSON
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          // Nếu không phải JSON, đọc nội dung dưới dạng text
          const errorText = await response.text();
          if (errorText) errorMessage += ` - ${errorText}`;
        }
        
        console.error('Lỗi API:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse dữ liệu trả về
      const data = await response.json();
      console.log('Dữ liệu trả về từ API:', data);
      
      if (data.success && data.script) {
        setLocalScript(data.script);
        setIsScriptSubmitted(true);
      } else {
        throw new Error(data.error || 'Không nhận được kịch bản hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi tạo kịch bản:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể tạo kịch bản'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVoice = async (idx: number, apiType: 'vixtts', callback: (idx: number, apiType: 'vixtts') => Promise<void>) => {
    setLoadingStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], voice: true }
    }));
    
    try {
      // Gọi API tạo giọng đọc mới dựa trên giọng đọc mẫu đã chọn
      await callback(idx, apiType);
      console.log(`Đã gửi yêu cầu tạo giọng đọc mới dựa trên giọng mẫu cho phân đoạn ${idx + 1}`);
    } catch (error) {
      console.error(`Lỗi khi tạo giọng đọc mới cho phân đoạn ${idx}:`, error);
      alert(`Lỗi: Không thể tạo giọng đọc mới cho phân đoạn ${idx + 1}`);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [idx]: { ...prev[idx], voice: false }
      }));
    }
  };



  // Reference cho input file
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State lưu trữ danh sách ảnh tìm thấy từ Pexels
  const [pexelsImages, setPexelsImages] = useState<{[key: number]: any[]}>({});
  
  const handleGenerateImage = async (idx: number, style: 'realistic' | 'anime', callback: (idx: number, style: 'realistic' | 'anime') => Promise<void>) => {
    setLoadingStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], image: true }
    }));
    
    try {
      // Nếu là luồng basic, sử dụng Pexels thay vì Gemini
      if (branding === 'basic') {
        // Lấy mô tả ảnh từ phân đoạn
        const segment = (localScript || script)?.segments[idx];
        if (!segment) {
          throw new Error('Không tìm thấy phân đoạn');
        }
        
        const imageDescription = segment.image_description;
        if (!imageDescription) {
          throw new Error('Vui lòng nhập mô tả ảnh trước khi tạo ảnh');
        }
        
        console.log(`Tìm ảnh Pexels cho phân đoạn ${idx + 1} với mô tả: ${imageDescription}`);
        
        // Lấy token xác thực từ localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Bạn chưa đăng nhập hoặc phiên đã hết hạn');
        }
        
        // Gọi API tìm kiếm ảnh Pexels với token xác thực
        const response = await fetch('/api/search-pexels-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Thêm token xác thực
          },
          body: JSON.stringify({
            imageDescription,
            platform, // Sử dụng nền tảng đã chọn để xác định kích thước ảnh
            segmentIdx: idx
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Lỗi khi tìm ảnh từ Pexels');
        }
        
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          // Cập nhật ảnh cho phân đoạn
          const updatedSegments = [...(localScript || script)!.segments];
          updatedSegments[idx] = {
            ...updatedSegments[idx],
            direct_image_url: data.imageUrl,
            pexels_data: data.image_data // Lưu thông tin ảnh Pexels để hiển thị credit
          };
          
          setLocalScript(prev => ({
            ...prev!,
            segments: updatedSegments
          }));
          
          // Lưu danh sách tất cả các ảnh tìm thấy để hiển thị cho người dùng chọn
          if (data.all_images && Array.isArray(data.all_images) && data.all_images.length > 0) {
            setPexelsImages(prev => ({
              ...prev,
              [idx]: data.all_images
            }));
            console.log(`Đã tìm thấy ${data.all_images.length} ảnh Pexels với mô tả: ${data.keyword}`);
          } else {
            console.log(`Đã tìm thấy ảnh Pexels với mô tả: ${data.keyword}`);
          }
        } else {
          throw new Error('Không tìm thấy ảnh phù hợp');
        }
      } else {
        // Luồng khác basic, sử dụng Gemini để tạo ảnh
        await callback(idx, style);
      }
    } catch (error) {
      console.error(`Lỗi khi tạo ảnh cho phân đoạn ${idx}:`, error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể tạo ảnh cho phân đoạn ' + (idx + 1)}`);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [idx]: { ...prev[idx], image: false }
      }));
    }
  };
  
  // Hàm chọn ảnh từ danh sách ảnh Pexels
  const handleSelectPexelsImage = (idx: number, imageData: any) => {
    if (!imageData) return;
    
    const updatedSegments = [...(localScript || script)!.segments];
    updatedSegments[idx] = {
      ...updatedSegments[idx],
      direct_image_url: imageData.url,
      pexels_data: imageData
    };
    
    setLocalScript(prev => ({
      ...prev!,
      segments: updatedSegments
    }));
  };
  
  // Hàm xử lý upload ảnh
  const handleImageUpload = async (idx: number) => {
    if (!fileInputRef.current?.files?.length) {
      return;
    }
    
    setLoadingStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], image: true }
    }));
    
    try {
      const file = fileInputRef.current.files[0];
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Bạn chưa đăng nhập hoặc phiên đã hết hạn');
      }
      
      // Tạo form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', platform || 'default');
      formData.append('segmentIdx', idx.toString());
      
      // Gọi API upload ảnh
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi upload ảnh');
      }
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        // Cập nhật ảnh cho phân đoạn
        const updatedSegments = [...(localScript || script)!.segments];
        updatedSegments[idx] = {
          ...updatedSegments[idx],
          direct_image_url: data.imageUrl,
          is_uploaded: true // Đánh dấu đây là ảnh được upload
        };
        
        setLocalScript(prev => ({
          ...prev!,
          segments: updatedSegments
        }));
        
        console.log(`Đã upload và crop ảnh cho phân đoạn ${idx + 1}`);
      } else {
        throw new Error('Lỗi khi xử lý ảnh');
      }
    } catch (error) {
      console.error(`Lỗi khi upload ảnh cho phân đoạn ${idx}:`, error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể upload ảnh cho phân đoạn ' + (idx + 1)}`);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [idx]: { ...prev[idx], image: false }
      }));
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVoiceChange = (idx: number, voiceName: string) => {
    // Nếu là giọng đọc local
    if (voiceName.startsWith('local:')) {
      const localVoiceUrl = voiceName.replace('local:', '');
      
      // Cập nhật trực tiếp voice_url cho phân đoạn
      const updatedSegments = [...(localScript || script)!.segments];
      updatedSegments[idx] = {
        ...updatedSegments[idx],
        voiceName: voiceName,
        voice_url: localVoiceUrl
      };
      
      setLocalScript(prev => ({
        ...prev!,
        segments: updatedSegments
      }));
      
      // Vẫn gọi onVoiceChange để cập nhật state ở component cha
      onVoiceChange(idx, voiceName);
    } else {
      // Xử lý giọng đọc API bình thường
      onVoiceChange(idx, voiceName);
    }
  };

  const handleEditImageDesc = (idx: number, desc: string) => {
    onEditImageDesc(idx, desc);
  };

  const handleAddSegment = (insertIdx: number) => {
    if (!onAddSegment) {
      alert('Luồng này không hỗ trợ thêm phân đoạn.');
      return;
    }
    if (localScript) {
      const maxSegments = config.maxSegments;
      if (localScript.segments.length >= maxSegments) {
        alert(`Luồng ${branding} chỉ hỗ trợ tối đa ${maxSegments} phân đoạn.`);
        return;
      }
      const updatedScript = { ...localScript };
      updatedScript.segments.splice(insertIdx, 0, { script: 'Phân đoạn mới', image_description: '' });
      setLocalScript(updatedScript);
      onAddSegment(insertIdx);
    }
  };

  const handleRemoveSegment = (removeIdx: number) => {
    if (branding === 'basic') {
      alert('Luồng Basic không hỗ trợ xóa phân đoạn.');
      return;
    }
    if (localScript && localScript.segments.length > 1 && onRemoveSegment) {
      const updatedScript = { ...localScript };
      updatedScript.segments.splice(removeIdx, 1);
      setLocalScript(updatedScript);
      onRemoveSegment(removeIdx);
    }
  };
  
  const toggleSegmentExpand = (idx: number) => {
    setExpandedSegments(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };
  
  // Dọn dẹp interval khi unmount hoặc khi audio kết thúc
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handlePlayVoice = (idx: number, voiceUrl: string) => {
    // Dừng audio đang phát (nếu có)
    if (playingAudio) {
      playingAudio.pause();
      clearProgressInterval();
      
      if (currentlyPlayingIdx === idx) {
        setPlayingAudio(null);
        setCurrentlyPlayingIdx(null);
        setAudioProgress(0);
        setAudioDuration(0);
        return;
      }
    }
    
    // Phát audio mới
    const audio = new Audio(voiceUrl);
    
    // Xử lý khi audio được tải
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };
    
    // Cập nhật tiến trình phát
    audio.onplay = () => {
      clearProgressInterval();
      
      progressIntervalRef.current = setInterval(() => {
        setAudioProgress(audio.currentTime);
      }, 100);
    };
    
    // Xử lý khi audio kết thúc
    audio.onended = () => {
      setPlayingAudio(null);
      setCurrentlyPlayingIdx(null);
      setAudioProgress(0);
      clearProgressInterval();
    };
    
    // Xử lý khi audio bị dừng
    audio.onpause = () => {
      clearProgressInterval();
    };
    
    // Phát audio
    audio.play().catch(error => {
      console.error('Lỗi khi phát audio:', error);
      alert('Không thể phát audio. Vui lòng thử lại.');
      setPlayingAudio(null);
      setCurrentlyPlayingIdx(null);
    });
    
    setPlayingAudio(audio);
    setCurrentlyPlayingIdx(idx);
  };

  const handleCreateSegmentVideo = (idx: number) => {
    if (!onCreateSegmentVideo) {
      alert('Chức năng này chỉ có trong gói Premium');
      return;
    }
    
    // Cập nhật trạng thái loading
    setLoadingStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], video: true }
    }));
    
    try {
      onCreateSegmentVideo(idx, 'premium');
    } catch (error) {
      console.error(`Lỗi khi tạo video cho phân đoạn ${idx}:`, error);
      alert(`Lỗi: Không thể tạo video cho phân đoạn ${idx + 1}`);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [idx]: { ...prev[idx], video: false }
      }));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${config.bg} p-4 sm:p-8`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 sm:p-8 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <h1 className={`text-2xl sm:text-3xl font-bold text-${config.color}-500`}>{config.title}</h1>
          <div className="flex items-center gap-2">
            {config.features.map((feature, idx) => (
              <span key={idx} className={`text-xs px-2 py-1 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                {feature}
              </span>
            ))}
          </div>
        </div>
        {!isScriptSubmitted ? (
          <div className="w-full text-center">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">Nhập thông tin để tạo kịch bản</h2>
            
            <div className="mb-4">
              <label className="block text-left text-gray-700 text-sm font-bold mb-2">
                Chủ đề video *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Nhập chủ đề video..."
                className={`w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 ${config.ring}`}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-left text-gray-700 text-sm font-bold mb-2">
                Tóm tắt nội dung *
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nhập tóm tắt nội dung video..."
                className={`w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 ${config.ring}`}
                rows={3}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-left text-gray-700 text-sm font-bold mb-2">
                  Thời lượng (giây) *
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={15}
                  max={300}
                  className={`w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 ${config.ring}`}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div>
                <label className="block text-left text-gray-700 text-sm font-bold mb-2">
                  Nền tảng mạng xã hội *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 ${config.ring}`}
                  disabled={isLoading}
                  required
                >
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="YouTube">YouTube</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-left text-gray-700 text-sm font-bold mb-2">
                Phong cách (tùy chọn)
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 ${config.ring}`}
                disabled={isLoading}
              >
                <option value="">Không có phong cách cụ thể</option>
                <option value="funny">Funny</option>
                <option value="inspirational">Inspirational</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            
            <button
              onClick={handleScriptSubmit}
              className={`px-6 py-2 rounded ${config.button} text-white font-medium transition`}
              disabled={!subject.trim() || !summary.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Tạo Kịch Bản"
              )}
            </button>
          </div>
        ) : !localScript && !script ? (
          <div className="text-gray-600 text-center">
            <p className="mb-2">Chưa có kịch bản nào được tạo.</p>
            <p>Hãy nhập thông tin và nhấn "Tạo kịch bản" ở bước trước.</p>
          </div>
        ) : (
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold mb-6 text-gray-700 text-center">{localScript?.title || script?.title}</h2>
            
            {/* Thanh tiến trình và thông tin tổng quan */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
              <div className="flex flex-wrap justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-800">Tiến trình dự án</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
                    {(localScript?.segments || script?.segments || []).length} phân đoạn
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800`}>
                    {duration}s
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className={`bg-${config.color}-500 h-2.5 rounded-full`} style={{ width: '45%' }}></div>
              </div>
              
              <div className="flex flex-wrap justify-between text-xs text-gray-600">
                <span>Kịch bản ✓</span>
                <span>Giọng nói</span>
                <span>Hình ảnh</span>
                <span>Video</span>
                <span>Xuất bản</span>
              </div>
            </div>
            
            {/* Các nút điều khiển chính */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-lg bg-${config.color}-500 text-white hover:bg-${config.color}-600 transition font-medium`}
                onClick={() => {
                  setIsScriptSubmitted(false);
                  setLocalScript(undefined);
                }}
              >
                <Settings className="w-4 h-4" /> Chỉnh sửa thông tin
              </button>
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition font-medium`}
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn tạo lại kịch bản? Các thay đổi hiện tại sẽ bị mất.')) {
                    handleScriptSubmit();
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg> Tạo lại kịch bản
              </button>
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition font-medium`}
                onClick={onConfirm}
              >
                <Save className="w-4 h-4" /> Lưu dự án
              </button>
            </div>
            
            <div className="space-y-6">
              {(localScript?.segments || script?.segments || []).map((seg: Segment, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${expandedSegments[idx] ? 'border-' + config.color + '-300 shadow-md' : 'border-gray-200'} bg-white flex flex-col gap-4 relative transition-all duration-200`}
                >
                  {/* Nút thêm phân đoạn */}
                  {branding !== 'basic' && (
                    <button
                      type="button"
                      className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-${config.color}-500 text-white hover:bg-${config.color}-600 transition z-10`}
                      onClick={() => handleAddSegment(idx)}
                      title="Thêm phân đoạn phía trên"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Tiêu đề phân đoạn và nút xóa */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full bg-${config.color}-100 text-${config.color}-800 font-bold text-sm`}>
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-gray-700">Phân đoạn {idx + 1}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {branding !== 'basic' && (localScript?.segments.length || script?.segments?.length || 0) > 1 && (
                        <button
                          type="button"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                          onClick={() => handleRemoveSegment(idx)}
                          title="Xóa phân đoạn này"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={`w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition ${expandedSegments[idx] ? 'bg-gray-200' : ''}`}
                        onClick={() => toggleSegmentExpand(idx)}
                        title={expandedSegments[idx] ? 'Thu gọn phân đoạn' : 'Mở rộng phân đoạn'}
                      >
                        {expandedSegments[idx] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Nội dung kịch bản */}
                  <div className="text-gray-800 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {seg.script}
                  </div>
                  
                  {/* Mô tả ảnh */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Image className="w-4 h-4 text-gray-500" /> Mô tả ảnh:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={seg.image_description ?? ''}
                        className={`flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-${config.color}-500`}
                        placeholder="Nhập mô tả ảnh cho AI..."
                        onChange={(e) => handleEditImageDesc(idx, e.target.value)}
                      />
                      <button
                        className={`flex items-center gap-1 px-3 py-1 rounded-md bg-${config.color}-500 text-white hover:bg-${config.color}-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        onClick={() => handleGenerateImage(idx, 'realistic', onGenerateImageForSegment)}
                        disabled={loadingStates[idx]?.image}
                        title="Tạo ảnh từ mô tả"
                      >
                        {loadingStates[idx]?.image ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><Image className="w-4 h-4 mr-1" /> Tạo ảnh</>
                        )}
                      </button>
                      <button
                        className={`flex items-center gap-1 px-3 py-1 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loadingStates[idx]?.image}
                        title="Tải ảnh lên"
                      >
                        {loadingStates[idx]?.image ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><Upload className="w-4 h-4 mr-1" /> Tải lên</>
                        )}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={() => handleImageUpload(idx)}
                      />
                    </div>
                  </div>
                  
                  {/* Hiển thị ảnh */}
                  {seg.direct_image_url && (
                    <div className="flex flex-col items-center">
                      <img
                        src={seg.direct_image_url}
                        alt={`Ảnh phân đoạn ${idx + 1}`}
                        className="max-h-48 rounded-lg shadow border border-gray-200 object-contain"
                      />
                      
                      {/* Hiển thị danh sách ảnh tìm thấy từ Pexels để người dùng chọn */}
                      {branding === 'basic' && pexelsImages[idx] && pexelsImages[idx].length > 1 && (
                        <div className="mt-2 w-full">
                          <p className="text-sm text-gray-600 mb-1">Chọn ảnh:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {pexelsImages[idx].map((image, imageIdx) => (
                              <div 
                                key={image.id} 
                                className={`cursor-pointer rounded-md overflow-hidden border-2 ${seg.direct_image_url === image.url ? 'border-blue-500' : 'border-gray-200'}`}
                                onClick={() => handleSelectPexelsImage(idx, image)}
                              >
                                <img 
                                  src={image.thumbnail} 
                                  alt={`Tùy chọn ${imageIdx + 1}`} 
                                  className="w-full h-20 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Chỉ hiển thị nút Anime cho các luồng không phải basic */}
                      {branding !== 'basic' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            className={`flex items-center gap-1 px-3 py-1 rounded-md bg-pink-500 text-white hover:bg-pink-600 transition text-sm`}
                            onClick={() => handleGenerateImage(idx, 'anime', onGenerateImageForSegment)}
                            title="Tạo ảnh Anime"
                          >
                            <Image className="w-4 h-4 mr-1" /> Phong cách Anime
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Giọng đọc */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Mic className="w-4 h-4 text-gray-500" /> Chọn giọng đọc mẫu:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className={`flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-${config.color}-500`}
                        value={seg.voiceName || ''}
                        onChange={(e) => handleVoiceChange(idx, e.target.value)}
                      >
                        <option value="">Chọn giọng đọc mẫu...</option>
                        <optgroup label="Giọng đọc mẫu (dùng để tạo giọng đọc)">
                          {voiceOptions.map((opt) => (
                            <option key={opt.fileName} value={opt.fileName}>
                              {opt.displayName}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      <button
                        className={`flex items-center gap-1 px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        onClick={() => handleGenerateVoice(idx, 'vixtts', onGenerateVoiceForSegment)}
                        disabled={!seg.voiceName || loadingStates[idx]?.voice}
                        title={!seg.voiceName ? 'Chọn giọng đọc mẫu trước' : 'Tạo giọng đọc từ giọng mẫu'}
                      >
                        {loadingStates[idx]?.voice ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Tạo giọng đọc</>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Phát âm thanh */}
                  {seg.voice_url && (
                    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          className={`flex items-center justify-center w-10 h-10 rounded-full ${currentlyPlayingIdx === idx ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white transition`}
                          onClick={() => handlePlayVoice(idx, seg.voice_url || '')}
                          title={currentlyPlayingIdx === idx ? 'Dừng phát' : 'Phát giọng đọc'}
                        >
                          {currentlyPlayingIdx === idx ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            {currentlyPlayingIdx === idx ? 'Đang phát giọng đọc...' : 'Giọng đọc sẵn sàng'}
                          </div>
                          {currentlyPlayingIdx === idx && (
                            <div className="text-xs text-gray-500">
                              {Math.floor(audioProgress)}" / {Math.floor(audioDuration)}"
                            </div>
                          )}
                        </div>

                      </div>
                      
                      {/* Thanh tiến trình */}
                      {currentlyPlayingIdx === idx && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full" 
                            style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Tạo video */}
                  {branding === 'premium' && seg.voice_url && seg.direct_image_url && (
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        className={`flex items-center gap-1 px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        onClick={() => handleCreateSegmentVideo(idx)}
                        disabled={loadingStates[idx]?.video}
                        title="Tạo video cho phân đoạn này"
                      >
                        {loadingStates[idx]?.video ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><Video className="w-4 h-4" /> Tạo Video</>
                        )}
                      </button>
                      
                      {seg.video_url && (
                        <div className="mt-2">
                          <video 
                            controls 
                            src={seg.video_url} 
                            className="w-full max-w-md mx-auto rounded-lg shadow border border-gray-200"
                          >
                            Trình duyệt không hỗ trợ phát video.
                          </video>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Chi tiết mở rộng */}
                  {expandedSegments[idx] && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <h3 className="text-sm font-bold mb-2 text-gray-700">Chi tiết phân đoạn</h3>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex">
                          <span className="w-28 text-gray-500">Script:</span>
                          <span className="text-gray-700 flex-1">{seg.script}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">Mô tả ảnh:</span>
                          <span className="text-gray-700 flex-1">{seg.image_description || 'Chưa có'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">Giọng đọc:</span>
                          <span className="text-gray-700 flex-1">{seg.voiceName || 'Chưa chọn'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">Trạng thái:</span>
                          <div className="flex gap-2 flex-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${seg.script ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {seg.script ? 'Có script ✓' : 'Không có script'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${seg.voice_url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {seg.voice_url ? 'Có giọng đọc ✓' : 'Chưa có giọng đọc'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${seg.direct_image_url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {seg.direct_image_url ? 'Có hình ảnh ✓' : 'Chưa có hình ảnh'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Nút xác nhận */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={onConfirm}
                className={`px-6 py-3 rounded-lg ${config.button} text-white font-medium transition flex items-center gap-2`}
              >
                <Check className="w-5 h-5" /> Hoàn thành dự án
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWorkflowUnified;
