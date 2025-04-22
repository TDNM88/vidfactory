"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GradientButton } from "../ui-custom/gradient-button";
import { TrashIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import type { Script } from "../video-generator";

export type ScriptEditorProps = {
  script: Script;
  setScript: (script: Script) => void;
};

export function ScriptEditor({ script, setScript }: ScriptEditorProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [pendingRemoveIdx, setPendingRemoveIdx] = useState<number|null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState<number|null>(null);

  // Validate: tất cả phân đoạn đều phải có script và image_description không rỗng
  const hasEmpty = script.segments.some(seg => !seg.script.trim() || !seg.image_description.trim());

  const handleSegmentChange = (idx: number, key: "script" | "image_description", value: string) => {
    const newSegments = script.segments.map((seg, i) =>
      i === idx ? { ...seg, [key]: value } : seg
    );
    setScript({ ...script, segments: newSegments });
  };

  const handleAddSegment = (idx?: number) => {
    const newSeg = { script: "", image_description: "" };
    let newSegments = [...script.segments];
    if (typeof idx === "number") {
      newSegments.splice(idx + 1, 0, newSeg);
    } else {
      newSegments.push(newSeg);
    }
    setScript({ ...script, segments: newSegments });
  };

  const handleRemoveSegment = (idx: number) => {
    setPendingRemoveIdx(idx);
  };

  const confirmRemove = () => {
    if (pendingRemoveIdx === null) return;
    if (script.segments.length <= 1) return;
    const newSegments = script.segments.filter((_, i) => i !== pendingRemoveIdx);
    setScript({ ...script, segments: newSegments });
    setPendingRemoveIdx(null);
  };

  const cancelRemove = () => setPendingRemoveIdx(null);

  const moveSegment = (idx: number, dir: "up" | "down") => {
    const newSegments = [...script.segments];
    if (dir === "up" && idx > 0) {
      [newSegments[idx - 1], newSegments[idx]] = [newSegments[idx], newSegments[idx - 1]];
    } else if (dir === "down" && idx < newSegments.length - 1) {
      [newSegments[idx], newSegments[idx + 1]] = [newSegments[idx + 1], newSegments[idx]];
    }
    setScript({ ...script, segments: newSegments });
  };

  // Tooltip hướng dẫn
  const getTooltip = (field: 'script'|'image_description') => {
    if (field === 'script') return 'Nhập lời thoại cho phân đoạn này. Nên ngắn gọn, truyền cảm hứng.';
    return 'Nhập mô tả ảnh minh họa thật chi tiết (bối cảnh, màu sắc, cảm xúc, style, v.v.).';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề video</Label>
        {editingTitle ? (
          <input
            id="title"
            value={script.title}
            className="w-full border rounded px-2 py-1"
            onChange={e => setScript({ ...script, title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{script.title}</span>
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setEditingTitle(true)}
              aria-label="Sửa tiêu đề"
            >
              Sửa
            </button>
          </div>
        )}
      </div>
      <div className="space-y-6">
        {script.segments.map((seg, idx) => (
          <div key={idx} className="border rounded-lg p-4 relative bg-white/80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Phân đoạn {idx + 1}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => moveSegment(idx, "up")}
                  disabled={idx === 0} title="Di chuyển lên" aria-label="Di chuyển lên" style={{padding: 8, fontSize: 18}}>
                  <ArrowUpIcon />
                </button>
                <button type="button" onClick={() => moveSegment(idx, "down")}
                  disabled={idx === script.segments.length - 1} title="Di chuyển xuống" aria-label="Di chuyển xuống" style={{padding: 8, fontSize: 18}}>
                  <ArrowDownIcon />
                </button>
                <button type="button" onClick={() => handleAddSegment(idx)} title="Thêm phân đoạn sau" aria-label="Thêm phân đoạn sau" style={{padding: 8, fontSize: 18}}>
                  <PlusIcon />
                </button>
                <button type="button" onClick={() => handleRemoveSegment(idx)}
                  disabled={script.segments.length <= 1} title="Xóa phân đoạn" aria-label="Xóa phân đoạn" style={{padding: 8, fontSize: 18}}>
                  <TrashIcon />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Lời thoại</Label>
                <button type="button" aria-label="Hướng dẫn lời thoại" onMouseEnter={()=>setShowTooltip(idx*2)} onMouseLeave={()=>setShowTooltip(null)}
                  className="text-xs bg-gray-200 rounded px-1">?</button>
                {showTooltip===idx*2 && <span className="absolute left-32 top-2 bg-black text-white text-xs px-2 py-1 rounded z-10">{getTooltip('script')}</span>}
              </div>
              <Textarea
                value={seg.script}
                onChange={e => handleSegmentChange(idx, "script", e.target.value)}
                rows={2}
                className="resize-vertical"
                aria-label="Lời thoại"
              />
              <div className="flex items-center gap-2">
                <Label>Mô tả ảnh minh họa</Label>
                <button type="button" aria-label="Hướng dẫn mô tả ảnh" onMouseEnter={()=>setShowTooltip(idx*2+1)} onMouseLeave={()=>setShowTooltip(null)}
                  className="text-xs bg-gray-200 rounded px-1">?</button>
                {showTooltip===idx*2+1 && <span className="absolute left-32 top-14 bg-black text-white text-xs px-2 py-1 rounded z-10">{getTooltip('image_description')}</span>}
              </div>
              <Textarea
                value={seg.image_description}
                onChange={e => handleSegmentChange(idx, "image_description", e.target.value)}
                rows={2}
                className="resize-vertical"
                aria-label="Mô tả ảnh minh họa"
              />
            </div>
            {/* Popup xác nhận xóa */}
            {pendingRemoveIdx === idx && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-xl max-w-xs w-full">
                  <div className="mb-4">Bạn có chắc muốn xóa phân đoạn này không?</div>
                  <div className="flex gap-4 justify-end">
                    <button className="px-3 py-1 rounded bg-gray-200" onClick={cancelRemove}>Hủy</button>
                    <button className="px-3 py-1 rounded bg-red-500 text-white" onClick={confirmRemove}>Xóa</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <GradientButton onClick={() => handleAddSegment()} className="w-full" type="button">
          <PlusIcon className="inline mr-1" />Thêm phân đoạn mới
        </GradientButton>
        {hasEmpty && (
          <div className="text-red-600 text-sm mt-2">Vui lòng điền đầy đủ lời thoại và mô tả ảnh cho tất cả phân đoạn.</div>
        )}
      </div>
    </div>
  );
}
