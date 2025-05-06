import React from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useStoryboardWorkflow, Segment, Script, VoiceOption } from './useStoryboardWorkflow';

interface DashboardWorkflowUnifiedProps {
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
  branding: 'basic' | 'basic-plus' | 'premium';
}

const BRANDING_CONFIG = {
  'basic': {
    bg: 'from-green-50 to-blue-50',
    title: 'Storyboard Basic',
    color: 'green',
    button: 'bg-green-600 hover:bg-green-700',
    ring: 'focus:ring-green-500',
  },
  'basic-plus': {
    bg: 'from-yellow-50 to-blue-50',
    title: 'Storyboard Basic Plus',
    color: 'yellow',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    ring: 'focus:ring-yellow-500',
  },
  'premium': {
    bg: 'from-blue-50 to-purple-50',
    title: 'Storyboard Premium',
    color: 'blue',
    button: 'bg-blue-600 hover:bg-blue-700',
    ring: 'focus:ring-blue-500',
  },
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
  const {
    loadingStates,
    videoUrls,
    handleGenerateImage,
    handleGenerateVoice,
    handleCreateVideo,
  } = useStoryboardWorkflow({
    script,
    setScript: () => {},
    config: {},
  });
  const config = BRANDING_CONFIG[branding];

  const [scriptInput, setScriptInput] = React.useState<string>('');
  const [isScriptSubmitted, setIsScriptSubmitted] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [localScript, setLocalScript] = React.useState<Script | null>(null);

  const [subject, setSubject] = React.useState<string>('');
  const [summary, setSummary] = React.useState<string>('');
  const [duration, setDuration] = React.useState<number>(60); // Mặc định 60 giây
  const [platform, setPlatform] = React.useState<string>('TikTok'); // Mặc định TikTok
  const [style, setStyle] = React.useState<string>(''); // Phong cách video (tùy chọn)

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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi tạo kịch bản');
      }
      
      const data = await response.json();
      
      if (data.success && data.script) {
        setLocalScript(data.script);
        setIsScriptSubmitted(true);
      } else {
        throw new Error('Không nhận được kịch bản hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi tạo kịch bản:', error);
      alert('Có lỗi xảy ra khi tạo kịch bản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditImageDesc = (idx: number, desc: string) => {
    if (localScript) {
      const updatedScript = { ...localScript };
      updatedScript.segments[idx].image_description = desc;
      setLocalScript(updatedScript);
    }
  };

  const handleVoiceChange = (idx: number, voiceName: string) => {
    if (localScript) {
      const updatedScript = { ...localScript };
      updatedScript.segments[idx].voiceName = voiceName;
      setLocalScript(updatedScript);
    }
  };

  const handleAddSegment = (insertIdx: number) => {
    if (branding === 'basic') {
      alert('Luồng Basic không hỗ trợ thêm phân đoạn.');
      return;
    }
    if (localScript) {
      const maxSegments = branding === 'basic-plus' ? 10 : 20;
      if (localScript.segments.length >= maxSegments) {
        alert(`Luồng ${branding} chỉ hỗ trợ tối đa ${maxSegments} phân đoạn.`);
        return;
      }
      const updatedScript = { ...localScript };
      updatedScript.segments.splice(insertIdx, 0, { script: 'Phân đoạn mới', image_description: '' });
      setLocalScript(updatedScript);
    }
  };

  const handleRemoveSegment = (removeIdx: number) => {
    if (branding === 'basic') {
      alert('Luồng Basic không hỗ trợ xóa phân đoạn.');
      return;
    }
    if (localScript && localScript.segments.length > 1) {
      const updatedScript = { ...localScript };
      updatedScript.segments.splice(removeIdx, 1);
      setLocalScript(updatedScript);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${config.bg} p-4 sm:p-8`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 sm:p-8 flex flex-col items-center">
        <h1 className={`text-2xl sm:text-3xl font-bold text-${config.color}-500 mb-4`}>{config.title}</h1>
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
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700 text-center">{localScript?.title || script?.title}</h2>
            <div className="space-y-6">
              {(localScript?.segments || script?.segments || []).map((seg: Segment, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-4 relative"
                >
                  {branding !== 'basic' && (
                    <button
                      type="button"
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition z-10"
                      onClick={() => handleAddSegment(idx)}
                      title="Thêm phân đoạn phía trên"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  )}
                  <div className="flex flex-col sm:flex-row items-start gap-2">
                    <span className="font-bold text-gray-700 min-w-[80px] flex items-center">
                      Phân đoạn {idx + 1}:
                      {branding !== 'basic' && (localScript?.segments.length || script?.segments.length || 0) > 1 && (
                        <button
                          type="button"
                          className="ml-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-700 transition"
                          onClick={() => handleRemoveSegment(idx)}
                          title="Xóa phân đoạn này"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/><path d="M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      )}
                    </span>
                    <span className="text-gray-800 flex-1">{seg.script}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <label className="text-sm text-gray-500 min-w-[80px]">Mô tả ảnh:</label>
                    <input
                      type="text"
                      value={seg.image_description ?? ''}
                      className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-${config.color}-500`}
                      placeholder="Nhập mô tả ảnh cho AI..."
                      onChange={(e) => handleEditImageDesc(idx, e.target.value)}
                    />
                  </div>
                  {seg.direct_image_url && (
                    <img
                      src={seg.direct_image_url}
                      alt={`Ảnh phân đoạn ${idx + 1}`}
                      className="w-full max-w-xs rounded shadow border mx-auto"
                    />
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <label className="text-sm text-gray-500 min-w-[80px]">Giọng đọc:</label>
                    <select
                      className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-${config.color}-500`}
                      value={seg.voiceName || ''}
                      onChange={(e) => handleVoiceChange(idx, e.target.value)}
                    >
                      <option value="">Chọn giọng đọc...</option>
                      {voiceOptions.map((opt) => (
                        <option key={opt.fileName} value={opt.fileName}>
                          {opt.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateVoice(idx, 'f5-tts', onGenerateVoiceForSegment)}
                      disabled={!seg.voiceName || loadingStates[idx]?.voice}
                      title={seg.voiceName ? 'Tạo giọng F5' : 'Chọn giọng đọc trước'}
                    >
                      {loadingStates[idx]?.voice ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mic className="w-4 h-4" /> F5
                        </>
                      )}
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateVoice(idx, 'vixtts', onGenerateVoiceForSegment)}
                      disabled={!seg.voiceName || loadingStates[idx]?.voice}
                      title={seg.voiceName ? 'Tạo giọng VIXTTS' : 'Chọn giọng đọc trước'}
                    >
                      {loadingStates[idx]?.voice ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mic className="w-4 h-4" /> VIX
                        </>
                      )}
                    </button>
                    {seg.voice_url && (
                      <audio controls src={seg.voice_url} className="ml-2 max-w-[200px]">
                        Trình duyệt không hỗ trợ phát audio.
                      </audio>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-teal-500 text-white hover:bg-teal-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateImage(idx, 'realistic', onGenerateImageForSegment)}
                      disabled={loadingStates[idx]?.image}
                      title="Tạo ảnh Realistic"
                    >
                      {loadingStates[idx]?.image ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Ảnh Realistic</>
                      )}
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-pink-500 text-white hover:bg-pink-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateImage(idx, 'anime', onGenerateImageForSegment)}
                      disabled={loadingStates[idx]?.image}
                      title="Tạo ảnh Anime"
                    >
                      {loadingStates[idx]?.image ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Ảnh Anime</>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                    <button
                      className={`flex items-center gap-1 px-3 py-1 rounded bg-${config.color}-500 text-white hover:bg-${config.color}-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed`}
                      onClick={() => handleCreateVideo(
                        idx,
                        (i) => localScript?.segments[i]?.direct_image_url || script?.segments[i]?.direct_image_url,
                        async (imgBlob, i) => {
                          const form = new FormData();
                          form.append('image', imgBlob, `segment${i + 1}.png`);
                          const uploadRes = await fetch('/api/upload-to-vidu', {
                            method: 'POST',
                            body: form,
                          });
                          const uploadData = await uploadRes.json();
                          return uploadData;
                        },
                        (videoUrl) => {}
                      )}
                      disabled={loadingStates[idx]?.video}
                      title="Tạo video cho phân đoạn này"
                    >
                      {loadingStates[idx]?.video ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Tạo Video</>
                      )}
                    </button>
                    {videoUrls[idx] && (
                      <video controls src={videoUrls[idx]} className="ml-2 max-w-[200px]">
                        Trình duyệt không hỗ trợ phát video.
                      </video>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                className={`px-6 py-2 rounded bg-${config.color}-500 text-white hover:bg-${config.color}-600 transition`}
                onClick={onConfirm}
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWorkflowUnified;
