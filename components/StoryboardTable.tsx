import React from "react";
import Image from "next/image";
import { ImageIcon, Mic, Video, Edit2, Save, Play } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";

interface Segment {
  script: string;
  image_description?: string;
  direct_image_url?: string;
  image_path?: string;
  imageUrl?: string;
  image_base64?: string;
  voice_url?: string | undefined;
  voice_path?: string | undefined;
  video_path?: string;
  voiceName?: string;
}

interface VideoResult {
  type: "basic" | "premium" | "super";
  url: string;
}

interface VoiceOption {
  fileName: string;
  displayName: string;
}

interface StoryboardTableProps {
  segments: Segment[];
  voiceOptions: VoiceOption[];
  videoResults: VideoResult[][];
  openSegments: boolean[];
  modalVideo: { url: string; type: string } | null;
  setModalVideo: (v: { url: string; type: string } | null) => void;
  editable?: boolean;
  onEditSegment?: (idx: number) => void;
  editingSegment?: number | null;
  tempInputs?: { [key: string]: string };
  onTempInputChange?: (key: string, value: string) => void;
  onSaveEditing?: (idx: number) => void;
  onGenerateImageForSegment?: (idx: number) => void;
  onGenerateVoiceForSegment?: (idx: number, voiceApiType: "f5-tts" | "vixtts") => void;
  onCreateSegmentVideo?: (idx: number, type: "basic" | "premium" | "super") => void;
  onRemoveImage?: (idx: number) => void;
  onUploadImage?: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
  isLoading?: boolean;
  voiceApiType: "f5-tts" | "vixtts";
  onVoiceChange?: (idx: number, voiceName: string) => void;
  onAddSegment?: (insertIdx: number) => void;
  onRemoveSegment?: (removeIdx: number) => void;
}

const StoryboardTable: React.FC<StoryboardTableProps> = ({
  segments,
  voiceOptions,
  videoResults,
  openSegments,
  modalVideo,
  setModalVideo,
  editable = false,
  onEditSegment,
  editingSegment,
  onVoiceChange,
  tempInputs,
  onTempInputChange,
  onSaveEditing,
  onGenerateImageForSegment,
  onGenerateVoiceForSegment,
  onCreateSegmentVideo,
  onRemoveImage,
  onUploadImage,
  isLoading,
  voiceApiType,
  onAddSegment,
  onRemoveSegment,
}) => {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="min-w-[200px]">Nội dung</TableHead>
            <TableHead className="min-w-[150px]">Ảnh minh họa</TableHead>
            <TableHead className="min-w-[200px]">Audio</TableHead>
            <TableHead className="min-w-[180px]">Video phân đoạn</TableHead>
            {editable && <TableHead className="w-48 text-center">Thao tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {segments.map((segment, idx) => (
            <TableRow key={idx}>
              {/* SỐ THỨ TỰ */}
              <TableCell className="align-top text-center">{idx + 1}</TableCell>
              {/* NỘI DUNG */}
              <TableCell className="align-top">
                {editable && editingSegment === idx ? (
                  <div className="space-y-2">
                    <textarea
                      value={tempInputs?.[`script-${idx}`] ?? segment.script}
                      onChange={(e) => onTempInputChange && onTempInputChange(`script-${idx}`, e.target.value)}
                      className="w-full font-medium mb-2 border border-gray-200 rounded p-2 text-gray-900 focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                      rows={3}
                      disabled={!editable}
                    />
                    <input
                      value={tempInputs?.[`image_desc-${idx}`] ?? segment.image_description ?? ""}
                      onChange={(e) => onTempInputChange && onTempInputChange(`image_desc-${idx}`, e.target.value)}
                      className="w-full text-xs italic border border-gray-200 rounded p-2 text-gray-500 focus:ring-2 focus:ring-[hsl(160,83%,28%)] hover:border-[hsl(174,84%,50%)] transition"
                      placeholder="Mô tả ảnh (tùy chọn)"
                      disabled={!editable}
                    />
                    <button
                      onClick={() => onSaveEditing && onSaveEditing(idx)}
                      className="flex items-center text-[hsl(160,83%,28%)] hover:text-[hsl(174,84%,50%)] text-sm"
                      disabled={!editable}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Lưu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <p className="font-medium text-gray-900 flex-1">{segment.script}</p>
                      {editable && (
                        <button
                          onClick={() => onEditSegment && onEditSegment(idx)}
                          className="ml-2 text-gray-500 hover:text-[hsl(160,83%,28%)] transition"
                          title="Chỉnh sửa nội dung"
                          disabled={!editable}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs italic text-gray-500 hidden xl:block">
                      {segment.image_description || "Chưa có mô tả ảnh"}
                    </p>
                  </div>
                )}
              </TableCell>
              {/* ẢNH MINH HỌA */}
              <TableCell className="align-top">
                {(segment.direct_image_url || segment.imageUrl || segment.image_base64) ? (
                  <div className="relative w-[120px] h-[120px] rounded-xl border border-gray-200 overflow-hidden bg-gray-50 group">
                    <Image
                      src={segment.image_base64 || segment.direct_image_url || segment.imageUrl || "/placeholder.png"}
                      alt={`Ảnh ${idx + 1}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      onError={() => console.error(`Failed to load image for segment ${idx + 1}`)}
                    />
                    {editable && (
                      <button
                        onClick={() => onRemoveImage && onRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 shadow hover:bg-red-200 transition opacity-0 group-hover:opacity-100"
                        title="Xóa ảnh này"
                        disabled={!editable}
                      >
                        <svg width="18" height="18" fill="none" stroke="red" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  editable ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-gray-400 text-xs">Chưa có ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onUploadImage && onUploadImage(e, idx)}
                        className="block text-xs"
                        disabled={!editable}
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Chưa có ảnh</span>
                  )
                )}
              </TableCell>
              {/* AUDIO/VOICE */}
              <TableCell className="align-top">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {editable ? (
                      <div className="min-w-[140px]">
                        <Select
                          value={segment.voiceName || undefined}
                          onValueChange={(value: string) => onVoiceChange && onVoiceChange(idx, value)}
                          disabled={!editable}
                        >
                          <SelectTrigger className="w-full bg-white border-gray-300">
                            <SelectValue placeholder="Chọn giọng đọc" />
                          </SelectTrigger>
                          <SelectContent>
                            {voiceOptions.map((opt) => (
                              <SelectItem key={opt.fileName} value={opt.fileName}>
                                {opt.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : segment.voiceName ? (
                      <span className="text-gray-700 text-sm">{segment.voiceName}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Chưa chọn giọng</span>
                    )}
                    {segment.voiceName && (
                      <button
                        onClick={() => {
                          const audio = new Audio(`/ref_voices/${segment.voiceName}`);
                          audio.play().catch(() => console.error(`Failed to play sample voice for ${segment.voiceName}`));
                        }}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title="Nghe giọng mẫu"
                        disabled={!editable}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {segment.voice_url ? (
                    <audio controls src={segment.voice_url} className="w-full mt-2" />
                  ) : (
                    <span className="text-gray-400 text-xs">Chưa có audio</span>
                  )}
                </div>
              </TableCell>
              {/* VIDEO PHÂN ĐOẠN */}
              <TableCell className="align-top">
                {videoResults[idx]?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {videoResults[idx].map((video, vIdx) => (
                      <div key={vIdx} className="text-center">
                        <button
                          onClick={() => setModalVideo({ url: video.url, type: video.type })}
                          className="focus:outline-none"
                          aria-label={`Xem video ${video.type} phân đoạn ${idx + 1}`}
                        >
                          <video
                            src={video.url}
                            className="w-40 h-[90px] rounded-lg object-cover"
                            poster={segment.image_base64 || segment.direct_image_url || segment.imageUrl || "/placeholder.png"}
                            muted
                            aria-hidden="true"
                          />
                        </button>
                        <span className="mt-1 block text-xs uppercase text-gray-500">{video.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">Chưa có video</span>
                )}
              </TableCell>
              {/* THAO TÁC */}
              {editable && (
                <TableCell className="text-center align-top">
                  <div className="flex flex-col gap-2 items-center">
                    {/* Nút thêm phân đoạn phía trên */}
                    <button
                      type="button"
                      className="mb-2 px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition text-xs"
                      onClick={() => onAddSegment && onAddSegment(idx)}
                      title="Thêm phân đoạn phía trên"
                    >
                      Thêm phía trên
                    </button>
                    {/* Nút xóa phân đoạn */}
                    <button
                      type="button"
                      className="mb-2 px-2 py-1 rounded bg-red-500 text-white hover:bg-red-700 transition text-xs"
                      onClick={() => onRemoveSegment && onRemoveSegment(idx)}
                      title="Xóa phân đoạn này"
                    >
                      Xóa phân đoạn
                    </button>
                    {/* Tạo ảnh minh họa */}
                    <button
                      onClick={() => onGenerateImageForSegment && onGenerateImageForSegment(idx)}
                      disabled={isLoading || !segment.script}
                      title={`Tạo ảnh minh họa cho phân đoạn ${idx + 1}`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-[hsl(160,83%,28%)] text-white hover:bg-[hsl(160,84%,39%)] disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    {/* Tạo giọng đọc */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => onGenerateVoiceForSegment && onGenerateVoiceForSegment(idx, "f5-tts")}
                        disabled={isLoading || !segment.script || !segment.voiceName}
                        title={`Tạo giọng đọc F5-TTS cho phân đoạn ${idx + 1}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-[hsl(174,84%,50%)] text-white hover:bg-[hsl(174,84%,60%)] disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Mic className="w-5 h-5" />
                        <span className="sr-only">F5-TTS</span>
                      </button>
                      <button
                        onClick={() => onGenerateVoiceForSegment && onGenerateVoiceForSegment(idx, "vixtts")}
                        disabled={isLoading || !segment.script || !segment.voiceName}
                        title={`Tạo giọng đọc VixTTS cho phân đoạn ${idx + 1}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-violet-500 text-white hover:bg-violet-600 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Mic className="w-5 h-5" />
                        <span className="sr-only">VixTTS</span>
                      </button>
                    </div>
                    {/* Tạo video */}
                    <button
                      onClick={() => onCreateSegmentVideo && onCreateSegmentVideo(idx, "basic")}
                      disabled={isLoading || !segment.direct_image_url}
                      title={`Tạo video Basic cho phân đoạn ${idx + 1}`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {/* Nút thêm phân đoạn ở cuối */}
          {editable && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition"
                  onClick={() => onAddSegment && onAddSegment(segments.length)}
                  title="Thêm phân đoạn mới ở cuối"
                >
                  Thêm phân đoạn mới
                </button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default StoryboardTable;