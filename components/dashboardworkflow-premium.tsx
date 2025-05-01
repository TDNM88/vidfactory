// dashboardworkflow-storyboard.tsx

import React, { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * DashboardWorkflowStorybot: UI và logic cho luồng storybot (Premium/Super)
 * Hiển thị danh sách phân đoạn, hỗ trợ tạo ảnh Realistic/Anime, giọng đọc F5/VIX, và chỉnh sửa mô tả ảnh.
 */
interface Segment {
  script: string;
  image_description?: string;
  direct_image_url?: string;
  voice_url?: string;
  voiceName?: string;
}

interface Script {
  title: string;
  segments: Segment[];
}

interface VoiceOption {
  fileName: string;
  displayName: string;
}

interface Props {
  script?: Script;
  voiceOptions: VoiceOption[];
  voiceApiType: 'f5-tts' | 'vixtts';
  onVoiceChange: (idx: number, voiceName: string) => void;
  onGenerateVoiceForSegment: (idx: number, voiceApiType: 'f5-tts' | 'vixtts') => Promise<void>;
  onEditImageDesc: (idx: number, desc: string) => void;
  onGenerateImageForSegment: (idx: number, style: 'realistic' | 'anime') => Promise<void>;
  onConfirm: () => void; // New prop to handle confirmation
  onCreateSegmentVideo?: (idx: number, type: 'premium') => void;
  onAddSegment?: (insertIdx: number) => void;
  onRemoveSegment?: (removeIdx: number) => void;
}

const DashboardWorkflowStorybot: React.FC<Props> = ({
  script,
  voiceOptions,
  voiceApiType,
  onVoiceChange,
  onGenerateVoiceForSegment,
  onEditImageDesc,
  onGenerateImageForSegment,
  onConfirm, // Destructure the new prop
  onCreateSegmentVideo,
  onAddSegment,
  onRemoveSegment,
}) => {
  // Trạng thái loading cho từng phân đoạn
  const [loadingStates, setLoadingStates] = useState<{
    [key: number]: { image?: boolean; voice?: boolean; video?: boolean };
  }>({});

  // Thêm state lưu video url cho từng segment
  const [videoUrls, setVideoUrls] = useState<{ [key: number]: string }>({});

  // Hàm xử lý tạo ảnh với loading state
  const handleGenerateImage = async (idx: number, style: 'realistic' | 'anime') => {
    setLoadingStates((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], image: true },
    }));
    try {
      await onGenerateImageForSegment(idx, style);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo ảnh ${style} cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], image: false },
      }));
    }
  };

  // Hàm xử lý tạo giọng với loading state
  const handleGenerateVoice = async (idx: number, apiType: 'f5-tts' | 'vixtts') => {
    setLoadingStates((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], voice: true },
    }));
    try {
      await onGenerateVoiceForSegment(idx, apiType);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo giọng ${apiType} cho phân đoạn ${idx + 1}!`);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], voice: false },
      }));
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
  const handleCreateVideo = async (idx: number) => {
    setLoadingStates((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], video: true },
    }));
    try {
      const seg = script?.segments[idx];
      if (!seg?.direct_image_url) {
        toast.error('Phân đoạn chưa có ảnh minh họa!');
        return;
      }
      // Kiểm tra URL ảnh có hợp lệ không
      const imageUrl = seg.direct_image_url;
      // Thử fetch ảnh trước khi upload
      let imgRes;
      try {
        imgRes = await fetch(imageUrl);
      } catch (fetchErr) {
        console.error('Không fetch được ảnh từ URL:', imageUrl, fetchErr);
        toast.error('Không fetch được ảnh từ URL: ' + imageUrl);
        return;
      }
      if (!imgRes || !imgRes.ok) {
        console.error('Ảnh không tồn tại hoặc không truy cập được:', imageUrl, imgRes?.status);
        toast.error('Ảnh không tồn tại hoặc không truy cập được: ' + imageUrl);
        return;
      }
      const imgBlob = await imgRes.blob();
      // 2. Upload ảnh qua backend để lấy uri
      const form = new FormData();
      form.append('image', imgBlob, `segment${idx + 1}.png`);
      const uploadRes = await fetch('/api/upload-to-vidu', {
        method: 'POST',
        body: form,
      });
      let uploadData;
      try {
        uploadData = await uploadRes.json();
      } catch (e) {
        console.error('Lỗi parse JSON upload:', e);
        throw new Error('Lỗi không đọc được phản hồi upload ảnh');
      }
      if (!uploadRes.ok || !uploadData.uri) {
        console.error('Lỗi upload ảnh:', uploadData);
        throw new Error(uploadData?.error || 'Lỗi upload ảnh lên backend');
      }
      const uri = uploadData.uri;
      // 3. Gọi API tạo video với uri ảnh
      const viduApiKey = process.env.NEXT_PUBLIC_VIDU_API_KEY || '';
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
          images: [uri],
          prompt: seg.script,
          duration: 4,
          resolution: '720p',
          movement_amplitude: 'auto',
        }),
      });
      let videoData;
      try {
        videoData = await videoRes.json();
      } catch (e) {
        console.error('Lỗi parse JSON video:', e);
        throw new Error('Lỗi không đọc được phản hồi tạo video');
      }
      if (!videoRes.ok || !videoData.task_id) {
        console.error('Lỗi tạo video:', videoData);
        throw new Error(videoData?.message || 'Lỗi khi gửi yêu cầu tạo video');
      }
      toast.success('Đã gửi yêu cầu tạo video! Đang chờ kết quả...');
      // Tự động kiểm tra trạng thái task
      const status = await checkViduTaskStatus(videoData.task_id, viduApiKey);
      if (status.success) {
        toast.success('Tạo video thành công!');
        setVideoUrls((prev) => ({ ...prev, [idx]: status.videoUrl }));
      } else {
        console.error('Lỗi task Vidu:', status);
        toast.error(status.error || 'Tạo video thất bại!');
      }
    } catch (err: any) {
      console.error('Lỗi tạo video:', err);
      toast.error(err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Lỗi khi tạo video!');
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], video: false },
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-blue-50 p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 sm:p-8 flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-yellow-500 mb-4">Storyboard Premium</h1>
        {!script ? (
          <div className="text-gray-600 text-center">
            <p className="mb-2">Chưa có kịch bản nào được tạo.</p>
            <p>Hãy nhập thông tin và nhấn "Tạo kịch bản" ở bước trước.</p>
          </div>
        ) : (
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700 text-center">{script.title}</h2>
            <div className="space-y-6">
              {script.segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-4 relative"
                >
                  {/* Nút thêm phân đoạn phía trên */}
                  {onAddSegment && (
                    <button
                      type="button"
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition z-10"
                      onClick={() => onAddSegment(idx)}
                      title="Thêm phân đoạn phía trên"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  )}
                  {/* Script + nút xóa */}
                  <div className="flex flex-col sm:flex-row items-start gap-2">
                    <span className="font-bold text-gray-700 min-w-[80px] flex items-center">
                      Phân đoạn {idx + 1}:
                      {onRemoveSegment && script.segments.length > 1 && (
                        <button
                          type="button"
                          className="ml-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-700 transition"
                          onClick={() => onRemoveSegment(idx)}
                          title="Xóa phân đoạn này"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/><path d="M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      )}
                    </span>
                    <span className="text-gray-800 flex-1">{seg.script}</span>
                  </div>
                  {/* Mô tả ảnh */}
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <label className="text-sm text-gray-500 min-w-[80px]">Mô tả ảnh:</label>
                    <input
                      type="text"
                      value={seg.image_description ?? ''}
                      className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Nhập mô tả ảnh cho AI..."
                      onChange={(e) => onEditImageDesc(idx, e.target.value)}
                    />
                  </div>
                  {/* Ảnh minh họa */}
                  {seg.direct_image_url && (
                    <img
                      src={seg.direct_image_url}
                      alt={`Ảnh phân đoạn ${idx + 1}`}
                      className="w-full max-w-xs rounded shadow border mx-auto"
                    />
                  )}
                  {/* Chọn giọng đọc */}
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <label className="text-sm text-gray-500 min-w-[80px]">Giọng đọc:</label>
                    <select
                      className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      value={seg.voiceName || ''}
                      onChange={(e) => onVoiceChange(idx, e.target.value)}
                    >
                      <option value="">Chọn giọng đọc...</option>
                      {voiceOptions.map((opt) => (
                        <option key={opt.fileName} value={opt.fileName}>
                          {opt.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Nút tạo giọng và nghe thử */}
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateVoice(idx, 'f5-tts')}
                      disabled={!seg.voiceName || loadingStates[idx]?.voice}
                      title={seg.voiceName ? 'Tạo giọng F5' : 'Chọn giọng đọc trước'}
                    >
                      {loadingStates[idx]?.voice ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      Tạo F5
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateVoice(idx, 'vixtts')}
                      disabled={!seg.voiceName || loadingStates[idx]?.voice}
                      title={seg.voiceName ? 'Tạo giọng VIX' : 'Chọn giọng đọc trước'}
                    >
                      {loadingStates[idx]?.voice ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      Tạo VIX
                    </button>
                    {seg.voice_url && (
                      <audio controls src={seg.voice_url} className="ml-2 h-8 max-w-full">
                        Trình duyệt của bạn không hỗ trợ audio.
                      </audio>
                    )}
                  </div>
                  {/* Nút tạo ảnh Realistic/Anime */}
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateImage(idx, 'realistic')}
                      disabled={loadingStates[idx]?.image}
                      title="Tạo ảnh Realistic"
                    >
                      {loadingStates[idx]?.image ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        '🖼️'
                      )}
                      Realistic
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-pink-500 text-white hover:bg-pink-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleGenerateImage(idx, 'anime')}
                      disabled={loadingStates[idx]?.image}
                      title="Tạo ảnh Anime"
                    >
                      {loadingStates[idx]?.image ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        '🖼️'
                      )}
                      Anime
                    </button>
                  </div>
                  {/* Nút tạo video phân đoạn Premium */}
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleCreateVideo(idx)}
                      disabled={loadingStates[idx]?.video}
                      title="Tạo video phân đoạn Premium"
                    >
                      {loadingStates[idx]?.video ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        '🎬 Tạo Video'
                      )}
                    </button>
                    {/* Trạng thái đang tải video */}
                    {loadingStates[idx]?.video && (
                      <span className="ml-2 text-blue-600 text-xs animate-pulse">Đang tạo và tải video...</span>
                    )}
                    {/* Hiển thị preview video nếu đã có */}
                    {videoUrls[idx] && (
                      <div className="flex flex-col items-start mt-2">
                        <video src={videoUrls[idx]} controls className="w-full max-w-xs rounded shadow border mb-1" />
                        <a
                          href={videoUrls[idx]}
                          download={`video-premium-segment${idx + 1}.mp4`}
                          className="inline-block px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                          title="Tải video về máy"
                        >
                          ⬇️ Tải Video
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Nút thêm phân đoạn ở cuối */}
            {onAddSegment && (
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                  onClick={() => onAddSegment(script.segments.length)}
                  title="Thêm phân đoạn mới ở cuối"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}
            {/* Confirm Button to Proceed to Step 3 */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={onConfirm}
                className="w-full max-w-md bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white p-3 rounded-lg hover:opacity-90 transition-all duration-200"
                aria-label="Xác nhận kịch bản"
                title="Xác nhận kịch bản và tiếp tục"
              >
                Xác Nhận Kịch Bản
              </button>
            </div>
            {/* Back Button to Return to Step 1 */}
            <button
              onClick={() => onConfirm()} // For simplicity, reuse onConfirm; alternatively, add a separate handler
              className="mt-4 text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)] font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Quay Lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWorkflowStorybot;