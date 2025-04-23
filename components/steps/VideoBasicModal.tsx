import React, { useState } from "react";

interface VideoBasicModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (voiceName: string) => void;
  voices: string[];
  loading: boolean;
}

export default function VideoBasicModal({ open, onClose, onSubmit, voices, loading }: VideoBasicModalProps) {
  const [voice, setVoice] = useState(voices[0] || "");

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-xs shadow-xl">
        <h3 className="font-bold text-lg mb-4">Chọn giọng đọc</h3>
        <select
          className="w-full border rounded px-2 py-1 mb-4"
          value={voice}
          onChange={e => setVoice(e.target.value)}
        >
          {voices.map(v => (
            <option key={v} value={v}>{v.replace(/\.[^.]+$/, "")}</option>
          ))}
        </select>
        <div className="flex gap-2 mt-2">
          <button
            className="flex-1 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            onClick={onClose}
            disabled={loading}
          >Huỷ</button>
          <button
            className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            onClick={() => onSubmit(voice)}
            disabled={loading || !voice}
          >{loading ? "Đang tạo..." : "Tiến hành tạo video"}</button>
        </div>
      </div>
    </div>
  );
}
