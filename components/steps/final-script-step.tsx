import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Modal } from "../ui-custom/modal";
import VideoBasicModal from "./VideoBasicModal";
import { OutlineButton } from "../ui-custom/outline-button";
import { GradientButton } from "../ui-custom/gradient-button";
import type { SessionData } from "../video-generator";

type Props = {
  sessionData: SessionData;
  setSessionData: (d: SessionData) => void;
  onNext: () => void;
  onPrevious: () => void;
};

type VideoResult = {
  type: "basic" | "premium" | "super";
  url: string;
};

export default function FinalScriptStep({ sessionData, setSessionData, onNext, onPrevious }: Props) {
  const [editTitle, setEditTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(sessionData.script.title || "");
  const [editScriptIdx, setEditScriptIdx] = useState<number | null>(null);
  const [localScript, setLocalScript] = useState("");
  const [editDescIdx, setEditDescIdx] = useState<number | null>(null);
  const [localDesc, setLocalDesc] = useState("");
  const [basicModalIdx, setBasicModalIdx] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [script, setScript] = useState(sessionData.script);
  const [locked, setLocked] = useState(false);
  const [videoResults, setVideoResults] = useState<VideoResult[][]>(
    sessionData.script.segments.map(() => [])
  );
  const [videoUrlModal, setVideoUrlModal] = useState<{
    idx: number;
    type: "basic" | "premium" | "super";
    url: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [creatingVideo, setCreatingVideo] = useState<{ idx: number; type: string } | null>(null);
  const platform = (sessionData as any).platform || (sessionData.script as any).platform || "TikTok";
  const duration = (sessionData as any).duration || (sessionData.script as any).duration || 60;

  useEffect(() => {
    setScript(sessionData.script);
    setVideoResults(sessionData.script.segments.map(() => []));
  }, [sessionData.script]);

  async function handleBatchGenerateImages() {
    setBatchError(null);
    setBatchLoading(true);
    try {
      const prompts = script.segments.map((seg, idx) =>
        !(seg.image_path || seg.direct_image_url)
          ? seg.image_description || seg.script || `Ảnh minh họa cho phân đoạn ${idx + 1}`
          : null
      );
      const batch = prompts.map((p, idx) => ({ idx, prompt: p })).filter((x) => !!x.prompt);
      setBatchProgress({ current: 0, total: batch.length });

      let newSegments = [...script.segments];
      for (const { idx, prompt } of batch) {
        const form = new FormData();
        form.append("index", idx.toString());
        form.append("prompt", prompt!);
        const res = await fetch("/api/generate-images", { method: "POST", body: form });
        if (!res.body) throw new Error("Không nhận được dữ liệu từ API");
        const reader = res.body.getReader();
        let url: string | null = null;
        let done = false;
        while (!done) {
          const { value, done: doneRead } = await reader.read();
          if (value) {
            const text = new TextDecoder().decode(value);
            for (const line of text.split("\n")) {
              if (!line.trim()) continue;
              try {
                const evt = JSON.parse(line);
                if (evt.type === "image" && evt.direct_image_url) {
                  url = evt.direct_image_url;
                } else if (evt.type === "error") {
                  throw new Error(evt.message || "Lỗi không xác định");
                }
              } catch {}
            }
          }
          done = doneRead;
        }
        if (url) {
          newSegments[idx] = { ...newSegments[idx], direct_image_url: url };
        }
        setBatchProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      }
      const newScript = { ...script, segments: newSegments };
      setScript(newScript);
      setSessionData({ ...sessionData, script: newScript });
      toast.success("Đã tạo ảnh minh họa cho tất cả phân đoạn!");
    } catch (err: any) {
      setBatchError(err?.message || "Lỗi không xác định khi tạo ảnh");
      toast.error(err?.message || "Lỗi khi tạo ảnh minh họa");
    } finally {
      setBatchLoading(false);
    }
  }

  const handleCreateVideo = (seg: any, idx: number, type: "basic" | "premium" | "super") => {
    if (type === "basic") {
      setBasicModalIdx(idx);
    } else {
      setVideoUrlModal({ idx, type, url: "" });
    }
  };

  const handleConfirmVideoUrl = () => {
    if (!videoUrlModal) return;
    const { idx, type, url } = videoUrlModal;
    if (url) {
      setCreatingVideo({ idx, type });
      setTimeout(() => {
        setVideoResults((results) => {
          const next = [...results];
          next[idx] = [...(next[idx] || []), { type, url }];
          return next;
        });
        setCreatingVideo(null);
        toast.success(`Video ${type} cho phân đoạn ${idx + 1} đã được tạo!`);
        setVideoUrlModal(null);
      }, 1000);
    } else {
      toast.error("Vui lòng nhập URL video!");
    }
  };

  const handleChange = (data: any) => {
    const { platform: _pf, duration: _dr, ...rest } = data;
    setScript({ ...script, ...rest });
  };

  const handleConfirm = () => {
    setLocked(true);
    setSessionData({
      ...sessionData,
      script: { ...script },
      platform,
      duration,
    } as any);
    toast.success("Kịch bản đã được xác nhận và khóa!");
  };

  const handleEdit = (idx: number, field: "script" | "image_description", value: string) => {
    const newScript = { ...script };
    newScript.segments = [...newScript.segments];
    newScript.segments[idx] = { ...newScript.segments[idx], [field]: value };
    handleChange(newScript);
  };

  return (
    <div className="space-y-6">
      {/* Nút quay lại */}
      <div className="flex items-center gap-2 text-gray-600 cursor-pointer" onClick={onPrevious}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">Quay lại nhập yêu cầu của bạn đầu</span>
      </div>

      {/* Tiêu đề chính */}
      <h1 className="text-2xl font-bold text-green-600">Bằng điều khiển tạo video</h1>

      {/* Thông tin video */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
          {!locked ? (
            editTitle ? (
              <input
                className="border rounded px-2 py-1 bg-white w-full text-sm"
                value={localTitle}
                autoFocus
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => {
                  setScript({ ...script, title: localTitle });
                  setEditTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setScript({ ...script, title: localTitle });
                    setEditTitle(false);
                  }
                }}
              />
            ) : (
              <div
                className="cursor-pointer px-2 py-1 rounded hover:bg-gray-100 text-sm"
                onClick={() => setEditTitle(true)}
              >
                {script.title || <span className="text-gray-400">(Chưa có tiêu đề)</span>}
              </div>
            )
          ) : (
            <input
              className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed w-full text-sm"
              value={script.title || ""}
              disabled
              readOnly
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nền tảng</label>
          <input
            className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed w-full text-sm"
            value={platform}
            disabled
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Thời lượng</label>
          <input
            className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed w-full text-sm"
            value={duration + "s"}
            disabled
            readOnly
          />
        </div>
      </div>

      {/* Tiêu đề bước */}
      <h2 className="text-xl font-bold">Bước xác nhận kịch bản trước khi sản xuất</h2>

      {/* Nút tạo ảnh hàng loạt */}
      {!locked &&
        script.segments.length > 0 &&
        script.segments.some((seg) => !(seg.image_path || seg.direct_image_url)) && (
          <div className="mb-4">
            <GradientButton
              data-tip="Tạo ảnh minh họa tự động dựa trên mô tả hoặc nội dung kịch bản"
              disabled={batchLoading}
              onClick={handleBatchGenerateImages}
              className="px-3 py-1.5 text-sm"
            >
              {batchLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                  Đang tạo ảnh ({batchProgress.current}/{batchProgress.total})...
                </span>
              ) : (
                "Tạo ảnh minh họa tự động"
              )}
            </GradientButton>
            {batchError && <div className="text-red-600 mt-1 text-xs">{batchError}</div>}
          </div>
        )}

      {/* Danh sách phân đoạn */}
      <div className="space-y-4">
        {script.segments.map((seg, idx) => (
          <details
            key={idx}
            className="rounded-lg shadow bg-white p-4 border border-gray-200"
            open={editScriptIdx === idx || editDescIdx === idx}
          >
            <summary className="font-bold text-gray-800 cursor-pointer">
              Phân đoạn {idx + 1}
            </summary>
            <div className="mt-4 space-y-4">
              {/* Ảnh minh họa */}
              <div>
                {seg.image_path || seg.direct_image_url ? (
                  <img
                    src={seg.direct_image_url || seg.image_path}
                    alt={`Ảnh minh họa phân đoạn ${idx + 1}`}
                    className="w-full max-h-48 object-contain rounded-lg cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setPreviewImage(seg.direct_image_url || seg.image_path || null)}
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg text-gray-400 text-sm">
                    Chưa có ảnh minh họa
                  </div>
                )}
              </div>

              {/* Lời thoại */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-sm">Lời thoại:</span>
                  {!locked && (
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      data-tip="Chỉnh sửa lời thoại"
                      onClick={() => {
                        setEditScriptIdx(idx);
                        setLocalScript(seg.script || "");
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {editScriptIdx === idx ? (
                  <textarea
                    className="border rounded px-2 py-1 w-full min-h-[80px] text-sm"
                    value={localScript}
                    autoFocus
                    onChange={(e) => setLocalScript(e.target.value)}
                    onBlur={() => {
                      handleEdit(idx, "script", localScript);
                      setEditScriptIdx(null);
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {seg.script || <span className="text-gray-400">(Chưa có nội dung)</span>}
                  </p>
                )}
              </div>

              {/* Mô tả ảnh minh họa */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-sm">Mô tả ảnh minh họa:</span>
                  {!locked && (
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      data-tip="Chỉnh sửa mô tả ảnh"
                      onClick={() => {
                        setEditDescIdx(idx);
                        setLocalDesc(seg.image_description || "");
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {editDescIdx === idx ? (
                  <textarea
                    className="border rounded px-2 py-1 w-full min-h-[80px] text-sm"
                    value={localDesc}
                    placeholder="Mô tả ảnh, ví dụ: 'Một thành phố hiện đại vào ban đêm'"
                    onChange={(e) => setLocalDesc(e.target.value)}
                    onBlur={() => {
                      handleEdit(idx, "image_description", localDesc);
                      setEditDescIdx(null);
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {seg.image_description || (
                      <span className="text-gray-400">(Chưa có mô tả)</span>
                    )}
                  </p>
                )}
              </div>

              {/* Video đã tạo */}
              {videoResults[idx]?.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-sm">Video đã tạo:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {videoResults[idx].map((video, vIdx) => (
                      <div key={vIdx} className="relative">
                        <video
                          src={video.url}
                          controls
                          className="w-full h-40 rounded-lg object-cover"
                        />
                        <span
                          className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-white rounded ${
                            video.type === "basic"
                              ? "bg-blue-500"
                              : video.type === "premium"
                              ? "bg-purple-500"
                              : "bg-green-500"
                          }`}
                        >
                          {video.type === "basic"
                            ? "Basic"
                            : video.type === "premium"
                            ? "Premium"
                            : "Super Quality"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trạng thái tạo video */}
              {creatingVideo?.idx === idx && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                  <span className="text-sm">Đang tạo video {creatingVideo.type}...</span>
                </div>
              )}

              {/* Nút tạo video */}
              {(seg.image_path || seg.direct_image_url) && (
                <div className="space-y-2 mt-4">
                  <GradientButton
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-600 px-3 py-1.5 text-sm"
                    disabled={creatingVideo?.idx === idx}
                    data-tip="Tạo video đơn giản, nhanh chóng từ ảnh và kịch bản"
                    onClick={() => handleCreateVideo(seg, idx, "basic")}
                  >
                    Tạo video BASIC
                  </GradientButton>
                  <GradientButton
                    className="w-full bg-gradient-to-r from-purple-400 to-purple-600 px-3 py-1.5 text-sm"
                    disabled={creatingVideo?.idx === idx}
                    data-tip="Tạo video chất lượng cao với chuyển động mượt mà"
                    onClick={() => handleCreateVideo(seg, idx, "premium")}
                  >
                    Tạo video PREMIUM
                  </GradientButton>
                  <GradientButton
                    className="w-full bg-gradient-to-r from-green-400 to-green-600 px-3 py-1.5 text-sm"
                    disabled={creatingVideo?.idx === idx}
                    data-tip="Tạo video tối ưu với hiệu ứng chuyên nghiệp"
                    onClick={() => handleCreateVideo(seg, idx, "super")}
                  >
                    Tạo video SUPER QUALITY
                  </GradientButton>
                </div>
              )}

              {/* Nút thao tác */}
              {!locked && (
                <div className="flex justify-end gap-2 mt-4">
                  {script.segments.length > 1 && (
                    <OutlineButton
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100"
                      data-tip="Xóa phân đoạn này"
                      onClick={() => {
                        const newScript = { ...script };
                        newScript.segments = script.segments.filter((_, i) => i !== idx);
                        handleChange(newScript);
                        setVideoResults((prev) => prev.filter((_, i) => i !== idx));
                        toast.info(`Đã xóa phân đoạn ${idx + 1}`);
                      }}
                    >
                      Xóa
                    </OutlineButton>
                  )}
                  {idx === script.segments.length - 1 && (
                    <OutlineButton
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100"
                      data-tip="Thêm phân đoạn mới"
                      onClick={() => {
                        const newScript = { ...script };
                        newScript.segments = [
                          ...script.segments,
                          { script: "", image_description: "" },
                        ];
                        handleChange(newScript);
                        setVideoResults((prev) => [...prev, []]);
                        toast.info("Đã thêm phân đoạn mới");
                      }}
                    >
                      Thêm
                    </OutlineButton>
                  )}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      {/* Modal xem trước ảnh */}
      <Modal open={!!previewImage} onClose={() => setPreviewImage(null)}>
        <img src={previewImage || ""} alt="Preview" className="max-w-full max-h-[80vh] mx-auto rounded-lg" />
      </Modal>

      {/* Modal nhập URL video */}
      <Modal open={!!videoUrlModal} onClose={() => setVideoUrlModal(null)}>
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Nhập URL video {videoUrlModal?.type} cho phân đoạn {videoUrlModal?.idx !== undefined ? videoUrlModal.idx + 1 : ""}
          </h3>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 mb-4 text-sm"
            placeholder="Nhập URL video (ví dụ: https://example.com/video.mp4)"
            value={videoUrlModal?.url || ""}
            onChange={(e) => setVideoUrlModal({ ...videoUrlModal!, url: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <OutlineButton className="px-3 py-1.5 text-sm" onClick={() => setVideoUrlModal(null)}>
              Hủy
            </OutlineButton>
            <GradientButton className="px-3 py-1.5 text-sm" onClick={handleConfirmVideoUrl}>
              Xác nhận
            </GradientButton>
          </div>
        </div>
      </Modal>

      {/* Modal tạo video Basic */}
      {basicModalIdx !== null && (
        <VideoBasicModal
          segment={script.segments[basicModalIdx]}
          idx={basicModalIdx}
          onClose={() => setBasicModalIdx(null)}
          onConfirm={(url: string) => {
            setVideoResults((results) => {
              const next = [...results];
              next[basicModalIdx] = [...(next[basicModalIdx] || []), { type: "basic", url }];
              return next;
            });
            toast.success(`Video Basic cho phân đoạn ${basicModalIdx + 1} đã được tạo!`);
            setBasicModalIdx(null);
          }}
        />
      )}

      {!locked && (
        <GradientButton onClick={handleConfirm} className="mt-6 px-3 py-1.5 text-sm">
          Xác nhận & khóa kịch bản
        </GradientButton>
      )}
      {locked && (
        <div className="text-green-600 font-bold mt-4">
          Kịch bản đã được xác nhận và khóa chỉnh sửa.
        </div>
      )}
    </div>
  );
}