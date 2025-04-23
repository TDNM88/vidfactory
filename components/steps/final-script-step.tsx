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
  const [uploadingImageIdx, setUploadingImageIdx] = useState<number | null>(null);
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

  const handleImageUpload = (idx: number, file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một file ảnh!");
      return;
    }

    setUploadingImageIdx(idx);
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const newScript = { ...script };
      newScript.segments = [...newScript.segments];
      newScript.segments[idx] = { ...newScript.segments[idx], direct_image_url: imageUrl };
      setScript(newScript);
      setSessionData({ ...sessionData, script: newScript });
      setUploadingImageIdx(null);
      toast.success(`Đã upload ảnh cho phân đoạn ${idx + 1}!`);
    };
    reader.onerror = () => {
      setUploadingImageIdx(null);
      toast.error("Lỗi khi upload ảnh!");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
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
              className="px-3 py-1.5 text-sm shadow-sm hover:shadow-md"
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

      {/* Danh sách phân đoạn - Lưới 2 cột */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="relative">
                {seg.image_path || seg.direct_image_url ? (
                  <img
                    src={seg.direct_image_url || seg.image_path}
                    alt={`Ảnh minh họa phân đoạn ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setPreviewImage(seg.direct_image_url || seg.image_path || null)}
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg text-gray-400 text-sm">
                    Chưa có ảnh minh họa
                  </div>
                )}
                {/* Nếu locked, KHÔNG render nút ở đây (phía trên ảnh), chỉ render ở dưới cùng phân đoạn */}
                {!locked ? (
                  <label
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm text-gray-700"
                    data-tip="Upload ảnh minh họa từ thiết bị"
                  >
                    {uploadingImageIdx === idx ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    )}
                    <span>Upload ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(idx, file);
                      }}
                    />
                  </label>
                ) : null}
                  <label
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm text-gray-700"
                    data-tip="Upload ảnh minh họa từ thiết bị"
                  >
                    {uploadingImageIdx === idx ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    )}
                    <span>Upload ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(idx, file);
                      }}
                    />
                  </label>
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
                  <div className="grid grid-cols-1 gap-4">
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
                              ? "bg-amber-600"
                              : video.type === "premium"
                              ? "bg-gray-500"
                              : "bg-yellow-500"
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

              {/* Khu vực nút tạo video và nút thao tác */}
              <div className="space-y-2 mt-4">
                {/* Nút tạo video - Hàng ngang */}
                {(seg.image_path || seg.direct_image_url) && locked && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <GradientButton
                      className="bg-gradient-to-r from-gray-300 to-gray-500 px-2 py-1 text-sm text-gray-900 font-semibold shadow-sm hover:shadow-md transition-shadow"
                      disabled={creatingVideo?.idx === idx}
                      data-tip="Tạo video đơn giản, nhanh chóng từ ảnh và kịch bản"
                      onClick={() => handleCreateVideo(seg, idx, "basic")}
                    >
                      Tạo BASIC
                    </GradientButton>
                    <GradientButton
                      className="bg-gradient-to-r from-[#b87333] to-[#ad7e4c] px-2 py-1 text-sm text-white font-semibold shadow-sm hover:shadow-md transition-shadow"
                      disabled={creatingVideo?.idx === idx}
                      data-tip="Tạo video chất lượng cao với chuyển động mượt mà"
                      onClick={() => handleCreateVideo(seg, idx, "premium")}
                    >
                      Tạo PREMIUM
                    </GradientButton>
                    <GradientButton
                      className="bg-gradient-to-r from-[#ffe066] to-[#f9d423] px-2 py-1 text-sm text-yellow-900 font-semibold shadow-sm hover:shadow-md transition-shadow"
                      disabled={creatingVideo?.idx === idx}
                      data-tip="Tạo video tối ưu với hiệu ứng chuyên nghiệp"
                      onClick={() => handleCreateVideo(seg, idx, "super")}
                    >
                      Tạo SUPER
                    </GradientButton>
                  </div>
                )}

                {/* Nút thao tác - Xóa và Thêm */}
                {!locked && (
                  <div className="flex justify-center gap-2">
                    {script.segments.length > 1 && (
                      <OutlineButton
                        className="px-2 py-1 text-sm bg-red-500 text-white hover:bg-red-600"
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
                        className="px-2 py-1 text-sm bg-green-50 text-green-700 hover:bg-green-200"
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
        <GradientButton onClick={handleConfirm} className="mt-6 px-3 py-1.5 text-sm shadow-sm hover:shadow-md">
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