import React, { useState } from "react";
import { OutlineButton } from "../ui-custom/outline-button";
import { GradientButton } from "../ui-custom/gradient-button";
import { FinalScriptEditor } from "./final-script-editor";
import type { SessionData } from "../video-generator";

export default function FinalScriptStep() { return null; } sessionData, setSessionData, onNext, onPrevious }: {
  sessionData: SessionData;
  setSessionData: (d: SessionData) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  // Lưu platform và duration vào sessionData.script
  // Tạm mở rộng type Script để tránh lỗi, thực tế platform/duration sẽ lưu riêng ngoài object script
  type ScriptWithMeta = typeof script & { platform?: string; duration?: number };
  // Lấy platform/duration từ sessionData truyền vào, không cho phép chỉnh sửa nữa
  // Ưu tiên lấy platform/duration từ sessionData ngoài cùng, sau đó đến script, cuối cùng mới mặc định
  const platform = ((sessionData as any).platform || (sessionData.script as any).platform || "TikTok");
  const duration = ((sessionData as any).duration || (sessionData.script as any).duration || 60);
  const [locked, setLocked] = useState(false);
  const [script, setScript] = useState(sessionData.script);

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
    // Tự động chuyển sang bước tiếp theo sau khi xác nhận
    setTimeout(() => {
      onNext();
    }, 400); // Cho hiệu ứng locked hiển thị ngắn rồi chuyển bước
  };

  // Hàm chỉnh sửa từng trường của segment
  const handleEdit = (idx: number, field: "script" | "image_description", value: string) => {
    const newScript = { ...script };
    newScript.segments = [...newScript.segments];
    newScript.segments[idx] = { ...newScript.segments[idx], [field]: value };
    handleChange(newScript);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bước xác nhận kịch bản trước khi sản xuất</h2>
      <div className="flex gap-4 items-end">
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
      <FinalScriptEditor
        script={script}
        platform={(sessionData as any).platform || platform}
        duration={(sessionData as any).duration || duration}
        onChange={handleChange}
        onConfirm={handleConfirm}
        locked={locked}
      />
      <div className="flex gap-3">
        <OutlineButton onClick={onPrevious} className="flex-1" disabled={locked}>
          Quay lại
        </OutlineButton>
        <GradientButton onClick={handleConfirm} className="flex-1" disabled={locked}>
          Xác nhận & khóa kịch bản
        </GradientButton>
      </div>
      {locked && (
        <div className="text-green-600 font-bold mt-4">Kịch bản đã được xác nhận và khóa chỉnh sửa.</div>
      )}
    </div>
  );
}
