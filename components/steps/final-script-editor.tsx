import React, { useState } from "react";
import { GradientButton } from "../ui-custom/gradient-button";

type Segment = {
  script: string;
  image_description: string;
  image_path?: string;
  audio_path?: string;
  direct_image_url?: string;
  direct_voice_url?: string;
  voice_sample_path?: string;
};

type Script = {
  title: string;
  segments: Segment[];
  video_path?: string;
  thumbnail_path?: string;
};

type FinalScriptEditorProps = {
  script: Script;
  platform: any;
  duration: any;
  onChange: (s: any) => void;
  onConfirm: () => void;
  locked: boolean;
};

export default function FinalScriptEditor({ script, locked, onConfirm, onChange, platform, duration }: FinalScriptEditorProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ script: string; image_description: string }>({ script: "", image_description: "" });
  const [loadingSegments, setLoadingSegments] = useState<{ [idx: number]: boolean }>({});

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditValues({
      script: script.segments[idx].script,
      image_description: script.segments[idx].image_description,
    });
  };

  const handleSave = (idx: number) => {
    const newSegments = script.segments.map((seg, i) =>
      i === idx ? { ...seg, script: editValues.script, image_description: editValues.image_description } : seg
    );
    onChange({ ...script, segments: newSegments });
    setEditIdx(null);
  };

  const handleCancel = () => {
    setEditIdx(null);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
          <label className="block font-semibold text-lg mb-1 md:mb-0">Tiêu đề video:</label>
          <input
            className="border rounded px-3 py-1 flex-1 max-w-md"
            value={script.title}
            onChange={e => onChange({ ...script, title: e.target.value })}
            disabled={locked}
          />
        </div>
        <h4 className="font-semibold text-lg mb-2">Storyboard kịch bản</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {script.segments.map((seg: Segment, idx: number) => (
            <div key={idx} className="rounded-xl shadow bg-white p-4 border border-gray-200">
              <div className="font-bold text-primary mb-1">Phân đoạn {idx + 1}</div>
              <div className="mb-2">
                <span className="block text-gray-700 text-sm font-medium mb-1">Lời thoại:</span>
                {editIdx === idx ? (
                  <textarea
                    className="w-full border rounded px-2 py-1 text-gray-900 mb-1"
                    value={editValues.script}
                    onChange={e => setEditValues((v: { script: string; image_description: string }) => ({ ...v, script: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <div className="bg-gray-50 rounded px-2 py-1 text-gray-900 whitespace-pre-line">
                    {seg.script}
                  </div>
                )}
              </div>
              <div className="mb-2">
                <span className="block text-gray-700 text-sm font-medium mb-1">Mô tả ảnh minh họa:</span>
                {editIdx === idx ? (
                  <textarea
                    className="w-full border rounded px-2 py-1 text-gray-900"
                    value={editValues.image_description}
                    onChange={e => setEditValues((v: { script: string; image_description: string }) => ({ ...v, image_description: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <div className="bg-gray-50 rounded px-2 py-1 text-gray-900 whitespace-pre-line">
                    {seg.image_description}
                  </div>
                )}
              </div>
              {/* Image upload/generate UI, only show when locked (script confirmed) */}
              {locked && (
                <div className="mt-4 p-2 bg-gray-50 rounded border border-dashed border-gray-300">
                  <div className="mb-2 font-semibold text-gray-700">Ảnh minh họa:</div>
                  {seg.image_path || seg.direct_image_url ? (
                    <img
                      src={seg.direct_image_url || seg.image_path}
                      alt={"Ảnh minh họa phân đoạn " + (idx + 1)}
                      className="w-full max-h-40 object-contain rounded mb-2"
                    />
                  ) : (
                    <div className="text-gray-400 italic mb-2">Chưa có ảnh</div>
                  )}
                  <div className="flex flex-row justify-center items-center gap-1 mt-1">
                    <label className="block cursor-pointer px-2 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200 transition text-sm">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setLoadingSegments(v => ({ ...v, [idx]: true }));
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("index", idx.toString());
                          if (platform) formData.append("platform", platform);
                          try {
                            const res = await fetch("/api/generate-images", { method: "POST", body: formData });
                            const reader = res.body?.getReader();
                            let imageUrl = "";
                            while (reader) {
                              const { value, done } = await reader.read();
                              if (done) break;
                              const lines = new TextDecoder().decode(value).split("\n").filter(Boolean);
                              for (const line of lines) {
                                try {
                                  const msg = JSON.parse(line);
                                  if (msg.type === "image" && msg.direct_image_url) {
                                    imageUrl = msg.direct_image_url;
                                  }
                                } catch {}
                              }
                            }
                            if (imageUrl) {
                              const newSegments = script.segments.map((s, i) =>
                                i === idx ? { ...s, image_path: imageUrl, direct_image_url: imageUrl } : s
                              );
                              onChange({ ...script, segments: newSegments });
                            }
                          } finally {
                            setLoadingSegments(v => ({ ...v, [idx]: false }));
                          }
                        }}
                      />
                      <span role="img" aria-label="upload" className="align-middle">📤</span> Upload ảnh
                    </label>
                    <button
                      className="px-2 py-1 rounded bg-blue-100 text-primary font-semibold hover:bg-blue-200 transition text-sm"
                      onClick={async () => {
                        setLoadingSegments(v => ({ ...v, [idx]: true }));
                        const prompt = seg.image_description || seg.script;
                        const formData = new FormData();
                        formData.append("prompt", prompt);
                        formData.append("index", idx.toString());
                        if (platform) formData.append("platform", platform);
                        try {
                          const res = await fetch("/api/generate-images", { method: "POST", body: formData });
                          const reader = res.body?.getReader();
                          let imageUrl = "";
                          while (reader) {
                            const { value, done } = await reader.read();
                            if (done) break;
                            const lines = new TextDecoder().decode(value).split("\n").filter(Boolean);
                            for (const line of lines) {
                              try {
                                const msg = JSON.parse(line);
                                if (msg.type === "image" && msg.direct_image_url) {
                                  imageUrl = msg.direct_image_url;
                                }
                              } catch {}
                            }
                          }
                          if (imageUrl) {
                            const newSegments = script.segments.map((s, i) =>
                              i === idx ? { ...s, image_path: imageUrl, direct_image_url: imageUrl } : s
                            );
                            onChange({ ...script, segments: newSegments });
                          }
                        } finally {
                          setLoadingSegments(v => ({ ...v, [idx]: false }));
                        }
                      }}
                      type="button"
                      disabled={loadingSegments[idx]}
                    >
                      {loadingSegments[idx] ? "Đang tạo ảnh..." : "Tạo ảnh tự động"}
                    </button>
                    {(seg.image_path || seg.direct_image_url) && (
                      <button
                        className="px-2 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition text-sm"
                        onClick={() => {
                          const newSegments = script.segments.map((s, i) =>
                            i === idx ? { ...s, image_path: undefined, direct_image_url: undefined } : s
                          );
                          onChange({ ...script, segments: newSegments });
                        }}
                        type="button"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Nút chỉnh sửa/xóa/thêm/chuyển chỉ hiện khi chưa locked (chưa xác nhận kịch bản) */}
              {!locked && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {editIdx === idx ? (
                    <>
                      <button
                        className="px-4 py-1 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
                        onClick={() => handleSave(idx)}
                      >
                        Lưu
                      </button>
                      <button
                        className="px-4 py-1 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                        onClick={handleCancel}
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="px-3 py-1 rounded bg-blue-100 text-primary font-semibold hover:bg-blue-200 transition"
                        onClick={() => handleEdit(idx)}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition"
                        onClick={() => {
                          if (idx > 0) {
                            const newSegments = [...script.segments];
                            [newSegments[idx - 1], newSegments[idx]] = [newSegments[idx], newSegments[idx - 1]];
                            onChange({ ...script, segments: newSegments });
                          }
                        }}
                        disabled={idx === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition"
                        onClick={() => {
                          if (idx < script.segments.length - 1) {
                            const newSegments = [...script.segments];
                            [newSegments[idx + 1], newSegments[idx]] = [newSegments[idx], newSegments[idx + 1]];
                            onChange({ ...script, segments: newSegments });
                          }
                        }}
                        disabled={idx === script.segments.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
                        onClick={() => {
                          const newSegments = script.segments.filter((_, i) => i !== idx);
                          onChange({ ...script, segments: newSegments });
                        }}
                        disabled={script.segments.length === 1}
                      >
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <button
        className="mt-4 px-4 py-2 rounded bg-green-100 text-green-800 font-semibold hover:bg-green-200 transition"
        onClick={() => {
          const newSegments = [
            ...script.segments,
            { script: "", image_description: "" },
          ];
          onChange({ ...script, segments: newSegments });
        }}
        disabled={locked}
      >
        + Thêm phân đoạn
      </button>
      <GradientButton onClick={onConfirm}>
        Xác nhận kịch bản
      </GradientButton>
    </div>
  );
}
