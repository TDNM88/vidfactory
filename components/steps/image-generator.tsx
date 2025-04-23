import type { SessionData } from "../video-generator";

export type Segment = {
  script: string;
  image_description: string;
  image_path?: string;
  audio_path?: string;
  direct_image_url?: string;
  direct_voice_url?: string;
  voice_sample_path?: string;
  video_status?: string;
  video_path?: string; // luôn là string hoặc undefined, không bao giờ là unknown
};

type ImageGeneratorProps = {
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  onNext: () => void;
  onPrevious: () => void;
  locked?: boolean;
};

import React, { useState } from "react";

export default function ImageGenerator({ sessionData, setSessionData, setIsLoading, isLoading, locked }: ImageGeneratorProps) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState<{[idx: number]: 'idle'|'loading'|'error'|'done'}>({});
  const [errorMsg, setErrorMsg] = useState<{[idx: number]: string}>({});

  const handleImageChange = (idx: number, url: string) => {
    const newSegments = sessionData.script.segments.map((seg, i) =>
      i === idx ? { ...seg, direct_image_url: url.replace('/generated-images/', '/generated/'), image_path: url.replace('/generated-images/', '/generated/'), video_path: seg.video_path || "" } : seg
    );
    setSessionData({ ...sessionData, script: { ...sessionData.script, segments: newSegments } });
  };

  const handleRemoveImage = (idx: number) => {
    const newSegments = sessionData.script.segments.map((seg, i) =>
      i === idx ? { ...seg, image_path: undefined, video_path: undefined } : seg
    );
    setSessionData({ ...sessionData, script: { ...sessionData.script, segments: newSegments } });
  };

  // Gọi API tạo ảnh minh họa
  const handleGenerateImage = async (idx: number) => {
    setProgress(p => ({ ...p, [idx]: 'loading' }));
    setErrorMsg(e => ({ ...e, [idx]: '' }));
    setIsLoading(true);
    setUploadingIdx(idx);
    try {
      const prompt = sessionData.script.segments[idx].image_description;
      const formData = new FormData();
      formData.append("index", idx.toString());
      formData.append("prompt", prompt || "");

      const response = await fetch("/api/generate-images", {
        method: "POST",
        body: formData,
      });
      if (!response.ok || !response.body) throw new Error("Không gọi được API tạo ảnh");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let imageUrl = null;
      let done = false;
      let errorMsg = "";
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const lines = decoder.decode(value).split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === "progress") {
                setProgress(p => ({ ...p, [idx]: "loading" }));
              } else if (data.type === "image" && data.direct_image_url) {
                imageUrl = data.direct_image_url;
                handleImageChange(idx, imageUrl);
                setProgress(p => ({ ...p, [idx]: "done" }));
              } else if (data.type === "error") {
                errorMsg = data.message || "Đã xảy ra lỗi khi tạo ảnh";
                setProgress(p => ({ ...p, [idx]: "error" }));
                setErrorMsg(e => ({ ...e, [idx]: errorMsg }));
              }
            } catch (e) {
              // ignore parse error
            }
          }
        }
      }
      if (!imageUrl && !errorMsg) {
        setProgress(p => ({ ...p, [idx]: "error" }));
        setErrorMsg(e => ({ ...e, [idx]: "Không nhận được ảnh từ API" }));
      }
    } catch (err: any) {
      setProgress(p => ({ ...p, [idx]: 'error' }));
      setErrorMsg(e => ({ ...e, [idx]: err.message || "Đã xảy ra lỗi khi tạo ảnh" }));
    } finally {
      setIsLoading(false);
      setUploadingIdx(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {sessionData.script.segments.map((seg: Segment, idx: number) => (
        <div key={idx} className="rounded-xl shadow bg-white p-4 border border-gray-200 flex flex-col gap-2">
          <div className="font-bold text-primary mb-1">Phân đoạn {idx + 1}</div>
          <div className="mb-2">
            <span className="block text-gray-700 text-sm font-medium mb-1">Mô tả ảnh:</span>
            <div className="text-gray-800 text-sm mb-2">{seg.image_description}</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {locked ? (
              <>
                <div className="relative w-full h-40 mb-1">
                  {seg.direct_image_url || seg.image_path ? (
                    <img
                      src={seg.direct_image_url || seg.image_path}
                      alt={`Ảnh minh họa ${idx + 1}`}
                      className="w-full h-40 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-100 text-gray-400 rounded">
                      Chưa có ảnh minh họa
                    </div>
                  )}
                </div>
              </>
            ) : seg.direct_image_url || seg.image_path ? (
              <>
                <div className="relative w-full h-40 mb-1">
                  <img
                    src={seg.direct_image_url || seg.image_path}
                    alt={`Ảnh minh họa ${idx + 1}`}
                    className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-80 transition"
                    onClick={async () => {
                      setIsLoading(true);
                      setUploadingIdx(idx);
                      const newSegments = sessionData.script.segments.map((seg, i) =>
                        i === idx ? { ...seg, video_status: "creating" } : seg
                      );
                      setSessionData({ ...sessionData, script: { ...sessionData.script, segments: newSegments } });
                      setTimeout(() => {
                        const updatedSegments = sessionData.script.segments.map((seg, i) =>
                          i === idx ? { ...seg, video_path: `https://placehold.co/400x300?text=Video+${idx+1}`, video_status: "done" } : seg
                        );
                        setSessionData({ ...sessionData, script: { ...sessionData.script, segments: updatedSegments } });
                        setIsLoading(false);
                        setUploadingIdx(null);
                      }, 2000);
                    }}
                  />
                  {seg.video_status === "creating" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-semibold rounded">
                      Đang tạo video...
                    </div>
                  )}
                  {seg.video_path && seg.video_status === "done" && (
                    <a href={seg.video_path} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">Xem video</a>
                  )}
                </div>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                  onClick={() => handleRemoveImage(idx)}
                  disabled={isLoading}
                >
                  Xóa ảnh
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                  onClick={() => handleGenerateImage(idx)}
                  disabled={progress[idx] === 'loading' || isLoading || uploadingIdx === idx}
                >
                  {progress[idx] === 'loading' ? "Đang tạo ảnh..." : "Tạo ảnh minh họa"}
                </button>
                {progress[idx] === 'loading' && (
                  <div className="text-xs text-blue-600 mt-1">Đang tạo ảnh minh họa...</div>
                )}
                {progress[idx] === 'error' && (
                  <div className="text-xs text-red-600 mt-1">{errorMsg[idx]}</div>
                )}
                {progress[idx] === 'done' && seg.image_path && (
                  <div className="text-xs text-green-600 mt-1">Đã tạo ảnh!</div>
                )}
                <label className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 cursor-pointer text-xs mt-1">
                  Tải ảnh minh họa lên
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProgress(p => ({ ...p, [idx]: 'loading' }));
                        setErrorMsg(e => ({ ...e, [idx]: '' }));
                        setIsLoading(true);
                        setUploadingIdx(idx);
                        try {
                          const formData = new FormData();
                          formData.append("index", idx.toString());
                          formData.append("file", file);
                          const platform = (sessionData as any).platform || (sessionData.script as any).platform || 'tiktok';
formData.append('platform', platform);
const response = await fetch("/api/generate-images", {
                            method: "POST",
                            body: formData,
                          });
                          if (!response.ok || !response.body) throw new Error("Không upload được ảnh");
                          const reader = response.body.getReader();
                          const decoder = new TextDecoder();
                          let imageUrl = null;
                          let done = false;
                          let errorMsg = "";
                          while (!done) {
                            const { value, done: streamDone } = await reader.read();
                            done = streamDone;
                            if (value) {
                              const lines = decoder.decode(value).split("\n");
                              for (const line of lines) {
                                if (!line.trim()) continue;
                                try {
                                  const data = JSON.parse(line);
                                  if (data.type === "progress") {
                                    setProgress(p => ({ ...p, [idx]: "loading" }));
                                  } else if (data.type === "image" && data.direct_image_url) {
                                    imageUrl = data.direct_image_url;
                                    handleImageChange(idx, imageUrl);
                                    setProgress(p => ({ ...p, [idx]: "done" }));
                                  } else if (data.type === "error") {
                                    errorMsg = data.message || "Đã xảy ra lỗi khi upload ảnh";
                                    setProgress(p => ({ ...p, [idx]: "error" }));
                                    setErrorMsg(e => ({ ...e, [idx]: errorMsg }));
                                  }
                                } catch (e) {
                                  // ignore parse error
                                }
                              }
                            }
                          }
                          if (!imageUrl && !errorMsg) {
                            setProgress(p => ({ ...p, [idx]: "error" }));
                            setErrorMsg(e => ({ ...e, [idx]: "Không nhận được ảnh từ API" }));
                          }
                        } catch (err: any) {
                          setProgress(p => ({ ...p, [idx]: 'error' }));
                          setErrorMsg(e => ({ ...e, [idx]: err.message || "Đã xảy ra lỗi khi upload ảnh" }));
                        } finally {
                          setIsLoading(false);
                          setUploadingIdx(null);
                        }
                      }
                    }}
                    disabled={isLoading}
                  />
                </label>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
