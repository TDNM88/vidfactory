// components/DashboardWorkflow.tsx
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";

// Định nghĩa kiểu dữ liệu
import type { SessionData, Script, Segment } from "./types";

interface VideoResult {
  type: "basic" | "premium" | "super";
  url: string;
}

// Kích thước theo nền tảng
const platformSizes: Record<string, { width: number; height: number }> = {
  TikTok: { width: 720, height: 1280 },
  YouTube: { width: 1280, height: 720 },
  Instagram: { width: 1080, height: 1080 },
};

// Component chính
interface DashboardWorkflowProps {
  sessionData: SessionData;
  setSessionData: React.Dispatch<React.SetStateAction<SessionData | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

const DashboardWorkflow: React.FC<DashboardWorkflowProps> = ({
  sessionData: propsSessionData,
  setSessionData: propsSetSessionData,
  setIsLoading: propsSetIsLoading,
  isLoading: propsIsLoading,
}) => {
  // State
  const [sessionData, setSessionData] = useState<SessionData>({
    subject: "",
    summary: "",
    platform: "TikTok",
    duration: 30,
    script: { title: "", segments: [] },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [videoResults, setVideoResults] = useState<VideoResult[][]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>("");
  const [backgroundMusic, setBackgroundMusic] = useState<string>("none");
  const [musicVolume, setMusicVolume] = useState<number>(0.2);

  // Cập nhật sessionData
  const updateSessionData = (newData: Partial<SessionData>) => {
    setSessionData((prev) => ({ ...prev, ...newData }));
  };

  // Xử lý loading
  const setLoading = (loading: boolean, message: string = "") => {
    setIsLoading(loading);
    setLoadingMessage(message);
  };

  // Bước 1: Tạo kịch bản
  const handleGenerateScript = async () => {
    if (!sessionData.subject || !sessionData.summary) {
      toast.error("Vui lòng nhập chủ đề và tóm tắt!");
      return;
    }
    setLoading(true, "Đang tạo kịch bản...");
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: sessionData.subject,
          summary: sessionData.summary,
          platform: sessionData.platform,
          duration: sessionData.duration,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.script) {
        throw new Error(data.error || "Lỗi khi tạo kịch bản");
      }
      updateSessionData({
        script: {
          ...data.script,
          platform: sessionData.platform,
          platform_width: platformSizes[sessionData.platform || "TikTok"].width,
          platform_height: platformSizes[sessionData.platform || "TikTok"].height,
        },
      });
      setVideoResults(new Array(data.script.segments.length).fill([]));
      toast.success("Đã tạo kịch bản thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tạo kịch bản!");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Tạo ảnh minh họa
  const handleGenerateImages = async () => {
    if (!sessionData.script.segments.length) {
      toast.error("Chưa có kịch bản để tạo ảnh!");
      return;
    }
    setLoading(true, "Đang tạo ảnh minh họa...");
    try {
      const imagePromises = sessionData.script.segments.map(async (segment, idx) => {
        const res = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: segment.image_description || segment.script,
            segmentIdx: idx,
          }),
        });
        const data = await res.json();
        if (!data.success || !data.imageUrl) {
          throw new Error(data.error || `Lỗi khi tạo ảnh cho phân đoạn ${idx + 1}`);
        }
        return { idx, imageUrl: data.imageUrl };
      });
      const results = await Promise.all(imagePromises);
      const newSegments = [...sessionData.script.segments];
      results.forEach(({ idx, imageUrl }) => {
        newSegments[idx] = { ...newSegments[idx], direct_image_url: imageUrl, image_path: imageUrl };
      });
      updateSessionData({
        script: { ...sessionData.script, segments: newSegments },
      });
      toast.success("Đã tạo tất cả ảnh minh họa!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tạo ảnh!");
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Tạo giọng đọc
  const handleGenerateVoices = async () => {
    if (!sessionData.script.segments.length) {
      toast.error("Chưa có kịch bản để tạo giọng đọc!");
      return;
    }
    setLoading(true, "Đang tạo giọng đọc...");
    try {
      const voicePromises = sessionData.script.segments.map(async (segment, idx) => {
        const res = await fetch("/api/generate-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: segment.script,
            segmentIdx: idx,
            voiceName: "voice1.wav", // Có thể thêm UI để chọn giọng
          }),
        });
        const data = await res.json();
        if (!data.success || !data.voiceUrl) {
          throw new Error(data.error || `Lỗi khi tạo giọng đọc cho phân đoạn ${idx + 1}`);
        }
        return { idx, voiceUrl: data.voiceUrl };
      });
      const results = await Promise.all(voicePromises);
      const newSegments = [...sessionData.script.segments];
      results.forEach(({ idx, voiceUrl }) => {
        newSegments[idx] = { ...newSegments[idx], voice_url: voiceUrl, voice_path: voiceUrl };
      });
      updateSessionData({
        script: { ...sessionData.script, segments: newSegments },
      });
      toast.success("Đã tạo tất cả giọng đọc!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tạo giọng đọc!");
    } finally {
      setLoading(false);
    }
  };

  // Bước 4: Tạo video phân đoạn
  const handleCreateSegmentVideo = async (idx: number, type: "basic" | "premium" | "super") => {
    const segment = sessionData.script.segments[idx];
    if (!segment.direct_image_url && !segment.image_path) {
      toast.error(`Phân đoạn ${idx + 1} chưa có ảnh minh họa!`);
      return;
    }
    if (!segment.voice_url && type !== "basic") {
      toast.error(`Phân đoạn ${idx + 1} chưa có giọng đọc!`);
      return;
    }
    setLoading(true, `Đang tạo video ${type} cho phân đoạn ${idx + 1}...`);
    try {
      let videoUrl: string;
      if (type === "basic") {
        const res = await fetch("/api/create-basic-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: segment.direct_image_url || segment.image_path,
            voiceUrl: segment.voice_url,
            segmentIdx: idx,
          }),
        });
        const data = await res.json();
        if (!data.success || !data.videoUrl) {
          throw new Error(data.error || "Lỗi khi tạo video Basic");
        }
        videoUrl = data.videoUrl;
      } else if (type === "premium") {
        const res = await fetch("/api/veo-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: segment.direct_image_url || segment.image_path,
            script: segment.script,
            segmentIdx: idx,
            platform: sessionData.platform,
          }),
        });
        const data = await res.json();
        if (!data.success || !data.videoUrl) {
          throw new Error(data.error || "Lỗi khi tạo video Premium");
        }
        videoUrl = data.videoUrl;
        const mergeRes = await fetch("/api/merge-video-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl,
            voiceUrl: segment.voice_url,
            segmentIdx: idx,
          }),
        });
        const mergeData = await mergeRes.json();
        if (!mergeData.success || !mergeData.videoUrl) {
          throw new Error(mergeData.error || "Lỗi khi ghép video và giọng đọc");
        }
        videoUrl = mergeData.videoUrl;
      } else {
        const { width, height } = platformSizes[sessionData.platform || "TikTok"];
        const res = await fetch("/api/vidu-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: segment.direct_image_url || segment.image_path,
            prompt: segment.image_description || segment.script,
            segmentIdx: idx,
            platform: sessionData.platform,
          }),
        });
        const data = await res.json();
        if (!data.success || !data.videoUrl) {
          throw new Error(data.error || "Lỗi khi tạo video Super");
        }
        videoUrl = data.videoUrl;
        const mergeRes = await fetch("/api/merge-video-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl,
            voiceUrl: segment.voice_url,
            segmentIdx: idx,
          }),
        });
        const mergeData = await mergeRes.json();
        if (!mergeData.success || !mergeData.videoUrl) {
          throw new Error(mergeData.error || "Lỗi khi ghép video và giọng đọc");
        }
        videoUrl = mergeData.videoUrl;
      }
      const newSegments = [...sessionData.script.segments];
      newSegments[idx] = { ...newSegments[idx], video_path: videoUrl };
      updateSessionData({
        script: { ...sessionData.script, segments: newSegments },
      });
      setVideoResults((prev) => {
        const next = [...prev];
        next[idx] = [...(next[idx] || []), { type, url: videoUrl }];
        return next;
      });
      toast.success(`Đã tạo video ${type} cho phân đoạn ${idx + 1}!`);
    } catch (err: any) {
      toast.error(err.message || `Lỗi khi tạo video ${type}!`);
    } finally {
      setLoading(false);
    }
  };

  // Bước 5: Ghép video tổng
  const handleConcatVideos = async () => {
    const videoFiles = sessionData.script.segments
      .map((seg) => seg.video_path)
      .filter((path): path is string => !!path);
    if (videoFiles.length === 0) {
      toast.error("Chưa có video phân đoạn để ghép!");
      return;
    }
    setLoading(true, "Đang ghép video tổng...");
    try {
      const res = await fetch("/api/concat-videos-with-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoFiles,
          musicFile: backgroundMusic !== "none" ? `/music/${backgroundMusic}` : undefined,
          musicVolume,
          platform: sessionData.platform,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.videoUrl) {
        throw new Error(data.error || "Lỗi khi ghép video tổng");
      }
      setFinalVideoUrl(data.videoUrl);
      toast.success("Đã ghép video tổng thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi ghép video tổng!");
    } finally {
      setLoading(false);
    }
  };

  // Dọn dẹp file
  const handleCleanup = async () => {
    setLoading(true, "Đang dọn dẹp file cũ...");
    try {
      const res = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Lỗi khi dọn dẹp file");
      }
      toast.success("Đã dọn dẹp file cũ thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi dọn dẹp file!");
    } finally {
      setLoading(false);
    }
  };

  // Giao diện
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tạo Video Tự Động</h1>

      {/* Bước 1: Nhập thông tin */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Bước 1: Nhập thông tin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Chủ đề</label>
            <input
              type="text"
              value={sessionData.subject}
              onChange={(e) => updateSessionData({ subject: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Ví dụ: Du lịch Đà Lạt"
            />
          </div>
          <div>
            <label className="block mb-1">Nền tảng</label>
            <select
              value={sessionData.platform}
              onChange={(e) => updateSessionData({ platform: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Tóm tắt</label>
            <textarea
              value={sessionData.summary}
              onChange={(e) => updateSessionData({ summary: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Ví dụ: Video giới thiệu các địa điểm du lịch nổi tiếng ở Đà Lạt..."
              rows={4}
            />
          </div>
          <div>
            <label className="block mb-1">Thời lượng (giây)</label>
            <input
              type="number"
              value={sessionData.duration}
              onChange={(e) => updateSessionData({ duration: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              min="10"
              max="300"
            />
          </div>
        </div>
        <button
          onClick={handleGenerateScript}
          disabled={isLoading}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Tạo Kịch Bản
        </button>
      </div>

      {/* Bước 2: Xem và tạo ảnh/giọng */}
      {sessionData.script.segments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Bước 2: Kịch bản và nội dung</h2>
          <h3 className="text-lg font-medium">Tiêu đề: {sessionData.script.title}</h3>
          <div className="space-y-4">
            {sessionData.script.segments.map((segment, idx) => (
              <div key={idx} className="border p-4 rounded">
                <h4 className="font-medium">Phân đoạn {idx + 1}</h4>
                <p><strong>Kịch bản:</strong> {segment.script}</p>
                {segment.image_description && (
                  <p><strong>Mô tả ảnh:</strong> {segment.image_description}</p>
                )}
                {segment.direct_image_url && (
                  <div className="mt-2">
                    <p><strong>Ảnh minh họa:</strong></p>
                    <Image
                      src={segment.direct_image_url}
                      alt={`Segment ${idx + 1}`}
                      width={200}
                      height={200}
                      className="object-cover"
                    />
                  </div>
                )}
                {segment.voice_url && (
                  <div className="mt-2">
                    <p><strong>Giọng đọc:</strong></p>
                    <audio controls src={segment.voice_url} className="w-full" />
                  </div>
                )}
                {videoResults[idx]?.length > 0 && (
                  <div className="mt-2">
                    <p><strong>Video phân đoạn:</strong></p>
                    {videoResults[idx].map((video, vIdx) => (
                      <div key={vIdx} className="mt-1">
                        <p>{video.type.toUpperCase()}:</p>
                        <video controls src={video.url} className="w-full max-w-xs" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 space-x-2">
                  {!segment.direct_image_url && (
                    <button
                      onClick={handleGenerateImages}
                      disabled={isLoading}
                      className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                    >
                      Tạo Ảnh
                    </button>
                  )}
                  {!segment.voice_url && (
                    <button
                      onClick={handleGenerateVoices}
                      disabled={isLoading}
                      className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                    >
                      Tạo Giọng
                    </button>
                  )}
                  <button
                    onClick={() => handleCreateSegmentVideo(idx, "basic")}
                    disabled={isLoading || !segment.direct_image_url}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                  >
                    Tạo Video Basic
                  </button>
                  <button
                    onClick={() => handleCreateSegmentVideo(idx, "premium")}
                    disabled={isLoading || !segment.direct_image_url || !segment.voice_url}
                    className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                  >
                    Tạo Video Premium
                  </button>
                  <button
                    onClick={() => handleCreateSegmentVideo(idx, "super")}
                    disabled={isLoading || !segment.direct_image_url || !segment.voice_url}
                    className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                  >
                    Tạo Video Super
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bước 3: Ghép video tổng */}
      {sessionData.script.segments.some((seg) => seg.video_path) && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Bước 3: Ghép video tổng</h2>
          <div className="mb-4">
            <label className="block mb-1">Nhạc nền</label>
            <select
              value={backgroundMusic}
              onChange={(e) => setBackgroundMusic(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="none">Không có</option>
              <option value="Music 1.mp3">Music 1</option>
              <option value="Music 2.mp3">Music 2</option>
              {/* Thêm các file nhạc khác trong public/music */}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Âm lượng nhạc nền: {musicVolume.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <button
            onClick={handleConcatVideos}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            Ghép Video Tổng
          </button>
          {finalVideoUrl && (
            <div className="mt-4">
              <h3 className="text-lg font-medium">Video tổng:</h3>
              <video controls src={finalVideoUrl} className="w-full max-w-md" />
              <a
                href={finalVideoUrl}
                download
                className="mt-2 inline-block bg-green-500 text-white px-4 py-2 rounded"
              >
                Tải Video
              </a>
            </div>
          )}
        </div>
      )}

      {/* Dọn dẹp */}
      <div className="mb-6">
        <button
          onClick={handleCleanup}
          disabled={isLoading}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Dọn Dẹp File Cũ
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <p>{loadingMessage}</p>
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mt-2"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWorkflow;