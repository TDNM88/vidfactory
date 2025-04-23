import React, { useState, useEffect } from "react";
import VideoBasicModal from "./VideoBasicModal";
import { join } from "path";
import { OutlineButton } from "../ui-custom/outline-button";
import { GradientButton } from "../ui-custom/gradient-button";

import type { SessionData } from "../video-generator";

type Props = {
  sessionData: SessionData;
  setSessionData: (d: SessionData) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export default function FinalScriptStep({ sessionData, setSessionData, onNext, onPrevious }: Props) {
  // Inline editing state
  const [editTitle, setEditTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(sessionData.script.title || "");
  const [editScriptIdx, setEditScriptIdx] = useState<number|null>(null);
  const [localScript, setLocalScript] = useState("");
  const [editDescIdx, setEditDescIdx] = useState<number|null>(null);
  const [localDesc, setLocalDesc] = useState("");

  // State cho modal và loading
  const [basicModalIdx, setBasicModalIdx] = useState<number|null>(null);
  const [basicLoading, setBasicLoading] = useState(false);
  const [voiceFiles, setVoiceFiles] = useState<string[]>([]);
  // --- Custom storyboard state ---
  const [script, setScript] = useState(sessionData.script);
  const [locked, setLocked] = useState(false);
  const [videoResults, setVideoResults] = useState<string[]>([]);
  const platform = ((sessionData as any).platform || (sessionData.script as any).platform || "TikTok");
  const duration = ((sessionData as any).duration || (sessionData.script as any).duration || 60);

  React.useEffect(() => {
    // Lấy danh sách file giọng đọc từ public/voices (chỉ lấy .wav)
    fetch("/api/voices").then(async (res) => {
      try {
        const files = await res.json();
        setVoiceFiles(files.filter((f: string) => f.endsWith('.wav')));
      } catch {}
    });
  }, []);

  // --- State cho batch image generation ---
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  // State cho dropdown chọn loại video
  const [videoDropdownIdx, setVideoDropdownIdx] = useState<number|null>(null);

  // Hàm sinh ảnh hàng loạt cho tất cả phân đoạn chưa có ảnh
  async function handleBatchGenerateImages() {
    setBatchError(null);
    setBatchLoading(true);
    try {
      // Lấy danh sách các mô tả ảnh chưa có ảnh
      const prompts = script.segments.map((seg, idx) =>
        !(seg.image_path || seg.direct_image_url) ? (seg.image_description || seg.script || `Ảnh minh họa cho phân đoạn ${idx + 1}`) : null
      );
      // Chỉ gửi các prompt cần tạo
      const batch = prompts.map((p, idx) => ({ idx, prompt: p })).filter(x => !!x.prompt);
      // Gọi API tuần tự từng ảnh (có thể cải thiện bằng Promise.all nếu backend hỗ trợ)
      let newSegments = [...script.segments];
      for (const { idx, prompt } of batch) {
        const form = new FormData();
        form.append('index', idx.toString());
        form.append('prompt', prompt!);
        const res = await fetch('/api/generate-images', { method: 'POST', body: form });
        if (!res.body) throw new Error('Không nhận được dữ liệu từ API');
        const reader = res.body.getReader();
        let url: string | null = null;
        let done = false;
        while (!done) {
          const { value, done: doneRead } = await reader.read();
          if (value) {
            const text = new TextDecoder().decode(value);
            // Có thể nhận nhiều event, lấy event chứa direct_image_url
            for (const line of text.split('\n')) {
              if (!line.trim()) continue;
              try {
                const evt = JSON.parse(line);
                if (evt.type === 'image' && evt.direct_image_url) {
                  url = evt.direct_image_url;
                } else if (evt.type === 'error') {
                  throw new Error(evt.message || 'Lỗi không xác định');
                }
              } catch {}
            }
          }
          done = doneRead;
        }
        if (url) {
          newSegments[idx] = { ...newSegments[idx], direct_image_url: url };
        }
      }
      // Cập nhật lại script
      const newScript = { ...script, segments: newSegments };
      setScript(newScript);
      setSessionData({ ...sessionData, script: newScript });
      setBatchLoading(false);
    } catch (err: any) {
      setBatchError(err?.message || 'Lỗi không xác định khi tạo ảnh');
      setBatchLoading(false);
    }
  }

  // --- Video creation handlers (must be inside component to access setVideoResults) ---
  async function handleCreateVideoServer(seg: any, idx: number) {
    const resultUrl = window.prompt("Fake server video URL for segment " + (idx + 1));
    if (resultUrl) setVideoResults((results: string[]) => {
      const next = [...results]; next[idx] = resultUrl; return next;
    });
  }

  async function handleCreateVideoVidu(seg: any, idx: number) {
    const resultUrl = window.prompt("Fake VIDU video URL for segment " + (idx + 1));
    if (resultUrl) setVideoResults((results: string[]) => {
      const next = [...results]; next[idx] = resultUrl; return next;
    });
  }

  async function handleCreateVideoTams(seg: any, idx: number) {
    const resultUrl = window.prompt("Fake TAMS video URL for segment " + (idx + 1));
    if (resultUrl) setVideoResults((results: string[]) => {
      const next = [...results]; next[idx] = resultUrl; return next;
    });
  }

  // Khi nhận props mới (sessionData), đồng bộ lại script
  useEffect(() => {
    setScript(sessionData.script);
  }, [sessionData.script]);

  // Khi chỉnh sửa bất kỳ trường nào, không cho phép thay đổi platform/duration ở bước này
  const handleChange = (data: any) => {
    const { platform: _pf, duration: _dr, ...rest } = data;
    setScript({ ...script, ...rest });
  };

  // Khi xác nhận kịch bản
  const handleConfirm = () => {
    setLocked(true);
    // Lưu lại vào sessionData
    setSessionData({
      ...sessionData,
      script: { ...script }, // Không gán platform, duration vào script
      platform,
      duration
    } as any);
    // KHÔNG chuyển bước sau khi xác nhận - chỉ locked UI
    // setTimeout(() => {
    //   onNext();
    // }, 400);
  };

  // Hàm chỉnh sửa từng trường của segment
  const handleEdit = (idx: number, field: "script" | "image_description", value: string) => {
    const newScript = { ...script };
    newScript.segments = [...newScript.segments];
    newScript.segments[idx] = { ...newScript.segments[idx], [field]: value };
    handleChange(newScript);
  };

  // Lấy danh sách file giọng đọc từ public/voices (chỉ lấy .wav)
  useEffect(() => {
    fetch("/api/voices").then(async (res) => {
      try {
        const files = await res.json();
        setVoiceFiles(files.filter((f: string) => f.endsWith('.wav')));
      } catch {}
    });
  }, []);

  return (
    <div className="space-y-6">
  <h2 className="text-2xl font-bold">Bước xác nhận kịch bản trước khi sản xuất</h2>
  <div className="flex gap-4 items-end">
    <div className="flex flex-col">
      <label className="font-medium block mb-1">Tiêu đề video</label>
      {!locked ? (
        editTitle ? (
          <input
            className="border rounded px-2 py-1 bg-white"
            value={localTitle}
            autoFocus
            onChange={e => setLocalTitle(e.target.value)}
            onBlur={() => { setScript({ ...script, title: localTitle }); setEditTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { setScript({ ...script, title: localTitle }); setEditTitle(false); }}}
          />
        ) : (
          <div className="cursor-pointer px-2 py-1 rounded hover:bg-gray-100" onClick={() => setEditTitle(true)}>
            {script.title || <span className="text-gray-400">(Chưa có tiêu đề)</span>}
          </div>
        )
      ) : (
        <input
          className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
          value={script.title || ''}
          disabled
          readOnly
        />
      )}
    </div>
        <div>
          <label className="font-medium block mb-1">Nền tảng</label>
          <input
            className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
            value={platform}
            disabled
            readOnly
          />
        </div>
        <div>
          <label className="font-medium block mb-1">Thời lượng dự kiến</label>
          <input
            className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
            value={duration + 's'}
            disabled
            readOnly
          />
        </div>
      <div>
        <label className="font-medium block mb-1">Nền tảng</label>
        <input
          className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
          value={platform}
          disabled
          readOnly
        />
      </div>
      <div>
        <label className="font-medium block mb-1">Thời lượng dự kiến</label>
        <input
          className="border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
          value={duration + 's'}
          disabled
          readOnly
        />
      </div>
    </div>
    <div>
      {/* Nút tạo ảnh hàng loạt */}
      {!locked && script.segments.length > 0 && script.segments.some(seg => !(seg.image_path || seg.direct_image_url)) && (
        <div className="mb-4">
          <button
            className="px-3 py-1 bg-gradient-to-r from-blue-400 to-green-400 text-white rounded font-semibold text-sm shadow hover:brightness-110 disabled:opacity-60"
            disabled={batchLoading}
            onClick={handleBatchGenerateImages}
          >
            {batchLoading ? 'Đang tạo ảnh minh họa tự động...' : 'Tạo ảnh minh họa tự động cho tất cả phân đoạn'}
          </button>
          {batchError && <div className="text-red-600 mt-1 text-xs">{batchError}</div>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {script.segments.map((seg, idx) => (
          <div key={idx} className="rounded-2xl shadow-lg bg-white p-5 border border-gray-100 flex flex-col gap-3 hover:shadow-2xl transition">
            {/* Ảnh minh họa */}
            <div className="relative mb-2">
              {seg.image_path || seg.direct_image_url ? (
                <img
                  src={seg.direct_image_url || seg.image_path}
                  alt={"Ảnh minh họa phân đoạn " + (idx + 1)}
                  className="w-full max-h-40 object-contain rounded mb-2"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-sm">
                  Chưa có ảnh minh họa
                </div>
              )}
            </div>
            {/* Nội dung kịch bản & mô tả ảnh */}
            {editScriptIdx === idx ? (
              <>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-semibold">Kịch bản:</span>
                  <input
                    className="border rounded px-1 py-0.5 ml-1 text-sm"
                    value={localScript}
                    autoFocus
                    onChange={e => setLocalScript(e.target.value)}
                    onBlur={() => { handleEdit(idx, "script", localScript); }}
                    onKeyDown={e => { if (e.key === 'Enter') { handleEdit(idx, "script", localScript); }}}
                    style={{minWidth: 80}}
                  />
                </div>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-semibold">Mô tả ảnh:</span>
                  <input
                    className="border rounded px-1 py-0.5 ml-1 text-sm"
                    value={localDesc}
                    onChange={e => setLocalDesc(e.target.value)}
                    onBlur={() => { handleEdit(idx, "image_description", localDesc); setEditScriptIdx(null); setEditDescIdx(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { handleEdit(idx, "image_description", localDesc); setEditScriptIdx(null); setEditDescIdx(null); }}}
                    style={{minWidth: 80}}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-semibold">Kịch bản:</span>
                  <span className="ml-1">{seg.script || <span className="text-gray-400">(Chưa có nội dung)</span>}</span>
                </div>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-semibold">Mô tả ảnh:</span>
                  <span className="ml-1">{seg.image_description || <span className="text-gray-400">(Chưa có mô tả)</span>}</span>
                </div>
              </>
            )}
            {/* Nút thao tác phân đoạn */}
            {!locked && (
              <div className="flex flex-row justify-center gap-3 mt-2 items-center">
                {script.segments.length > 1 && (
                  <button className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100" onClick={() => {
                    const newScript = { ...script };
                    newScript.segments = script.segments.filter((_, i) => i !== idx);
                    handleChange(newScript);
                  }}>Xoá</button>
                )}
                <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200" title="Chỉnh sửa kịch bản & mô tả ảnh" onClick={() => {
                  setEditScriptIdx(idx);
                  setEditDescIdx(idx);
                  setLocalScript(seg.script || "");
                  setLocalDesc(seg.image_description || "");
                }}>
                  <img src="/edit.svg" alt="edit" className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Nút tạo video gộp */}
            <div className="flex flex-row flex-wrap gap-2 mt-2 items-center">
              <div className="relative">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-semibold flex items-center"
                  disabled={!seg.image_path && !seg.direct_image_url}
                  onClick={() => setVideoDropdownIdx(idx === videoDropdownIdx ? null : idx)}
                  type="button"
                >
                  Tạo video
                  <svg className="ml-1 w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M7 8l3 3 3-3" /></svg>
                </button>
                {videoDropdownIdx === idx && (
                  <div className="absolute left-0 mt-1 w-36 bg-white border rounded shadow z-10">
                    <button
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-blue-50"
                      onClick={() => { setBasicModalIdx(idx); setVideoDropdownIdx(null); }}
                    >Tạo video Basic</button>
                    <button
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-purple-50"
                      onClick={async () => { await handleCreateVideoTams(seg, idx); setVideoDropdownIdx(null); }}
                    >Tạo video Premium</button>
                    <button
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-green-50"
                      onClick={async () => { await handleCreateVideoVidu(seg, idx); setVideoDropdownIdx(null); }}
                    >Tạo video Super Quality</button>
                  </div>
                )}
              </div>
              {videoResults[idx] && (
                <a href={videoResults[idx]} target="_blank" className="ml-2 text-xs text-green-600 underline whitespace-nowrap">Xem video</a>
              )}
            </div>
            {/* Nút thêm phân đoạn chỉ ở cuối */}
            {!locked && idx === script.segments.length - 1 && (
              <div className="flex flex-row justify-center mt-2">
                <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200" onClick={() => {
                  const newScript = { ...script };
                  newScript.segments = [
                    ...script.segments,
                    { script: '', image_description: '' }
                  ];
                  handleChange(newScript);
                }}>Thêm phân đoạn</button>
              </div>
            )}
            {/* Các nút tạo video */}
            <button
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold"
              onClick={() => setBasicModalIdx(idx)}
              disabled={!seg.image_path && !seg.direct_image_url}
            >Tạo video Basic</button>
            <button
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs font-semibold"
              onClick={async () => await handleCreateVideoTams(seg, idx)}
              disabled={!seg.image_path && !seg.direct_image_url}
            >Tạo video Premium</button>
            <button
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold"
              onClick={async () => await handleCreateVideoVidu(seg, idx)}
            >Tạo video Super Quality</button>
            {/* Hiển thị kết quả nếu có */}
            {videoResults[idx] && (
              <div className="mt-1 text-xs text-green-600">Đã tạo: <a href={videoResults[idx]} target="_blank" className="underline">Xem video</a></div>
            )}
          </div>
        ))}
      </div>
      {!locked && <GradientButton onClick={handleConfirm} className="flex-1 mt-6">Xác nhận & khóa kịch bản</GradientButton>}
    </div>
    {locked && (
      <div className="text-green-600 font-bold mt-4">Kịch bản đã được xác nhận và khóa chỉnh sửa.</div>
    )}
  </div>
);
}
