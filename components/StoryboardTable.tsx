import React from "react";
import Image from "next/image";
import { ImageIcon, Mic, Video, Edit2, Save, Play, Trash2, Plus, Sparkles, Workflow, Upload, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { useSecureMedia } from './useSecureMedia';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"; 
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

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
  onGenerateImageForSegment?: (idx: number, style: 'realistic' | 'anime') => void;
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
    <div className="hidden lg:block">
      <Table className="border rounded-md overflow-hidden">
        <TableHeader className="bg-slate-100">
          <TableRow>
            <TableHead className="w-12 text-center font-bold">Cảnh</TableHead>
            <TableHead className="min-w-[200px] font-bold">Kịch bản</TableHead>
            <TableHead className="min-w-[180px] font-bold">Hình ảnh/Video</TableHead>
            <TableHead className="min-w-[180px] font-bold">Âm thanh</TableHead>
            <TableHead className="min-w-[180px] font-bold">Video phân đoạn</TableHead>
            {editable && <TableHead className="w-24 text-center font-bold">Thao tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {segments.map((segment, idx) => (
            <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50 hover:bg-slate-100"}>
              {/* SỐ THỨ TỰ PHÂN CẢNH */}
              <TableCell className="align-top text-center font-medium border-r">
                <div className="flex flex-col items-center gap-1">
                  <Badge variant="outline" className="px-3 py-1 rounded-full font-bold">
                    {idx + 1}
                  </Badge>
                  
                  {editable && (
                    <div className="flex flex-col mt-2 gap-1">
                      <button
                        onClick={() => onAddSegment?.(idx)}
                        className="p-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600"
                        title="Thêm phân cảnh mới trước phân cảnh này"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      
                      {segments.length > 1 && (
                        <button
                          onClick={() => onRemoveSegment?.(idx)}
                          className="p-1 rounded-full bg-red-50 hover:bg-red-100 text-red-600"
                          title="Xóa phân cảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* NỘI DUNG KỊCH BẢN */}
              <TableCell className="align-top border-r">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0">
                    {editingSegment === idx ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={tempInputs?.[`script-${idx}`] || segment.script}
                          onChange={(e) => onTempInputChange?.(`script-${idx}`, e.target.value)}
                          className="w-full min-h-[120px] p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onEditSegment?.(null as any)}
                            className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => onSaveEditing?.(idx)}
                            className="px-2 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="max-h-[150px] overflow-y-auto pr-6 text-sm text-gray-800">
                          {segment.script}
                        </div>
                        {editable && (
                          <button
                            onClick={() => onEditSegment?.(idx)}
                            className="absolute top-0 right-0 p-1 text-gray-500 hover:text-blue-600"
                            title="Chỉnh sửa kịch bản"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TableCell>

              {/* HÌNH ẢNH/VIDEO */}
              <TableCell className="align-top border-r">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 space-y-2">
                    {/* Hiển thị hình ảnh hoặc thumbnail video */}
                    <div className="h-24 w-full flex justify-center items-center bg-gray-50 rounded-md overflow-hidden">
                      {segment.direct_image_url || segment.imageUrl || segment.image_path ? (
                        <SecureImagePreview
                          url={segment.direct_image_url || segment.imageUrl || segment.image_path}
                          idx={idx}
                          onRemoveImage={onRemoveImage}
                          editable={editable}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span className="text-xs">Chưa có hình ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Các nút chức năng liên quan tới hình ảnh */}
                    {editable && (
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => onGenerateImageForSegment?.(idx, 'realistic')}
                          disabled={isLoading}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Tạo ảnh
                        </button>
                        
                        <label className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onUploadImage?.(e, idx)}
                            className="hidden"
                          />
                          <Upload className="w-3 h-3 mr-1" />
                          Tải lên
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TableCell>

              {/* AUDIO/GIỌNG ĐỌC */}
              <TableCell className="align-top border-r">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 space-y-2">
                    {/* Lựa chọn giọng đọc */}
                    <div>
                      <Select
                        value={segment.voiceName || ""}
                        onValueChange={(value) => onVoiceChange?.(idx, value)}
                        disabled={!editable}
                      >
                        <SelectTrigger className="w-full text-xs h-8">
                          <SelectValue placeholder="Chọn giọng đọc" />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceOptions.map((voice) => (
                            <SelectItem key={voice.fileName} value={voice.fileName}>
                              {voice.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Audio player */}
                    <div className="mt-2">
                      {segment.voice_url || segment.voice_path ? (
                        <SecureAudio url={(segment.voice_url || segment.voice_path) as string | undefined} />
                      ) : (
                        <div className="h-8 flex items-center justify-center bg-gray-50 rounded text-xs text-gray-500">
                          Chưa có âm thanh
                        </div>
                      )}
                    </div>

                    {/* Nút tạo giọng đọc */}
                    {editable && (
                      <div className="mt-2">
                        <button
                          onClick={() => onGenerateVoiceForSegment?.(idx, voiceApiType)}
                          disabled={isLoading || !segment.voiceName}
                          className="w-full px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Mic className="w-3 h-3 mr-1" />
                          Tạo giọng đọc
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TableCell>

              {/* VIDEO PHÂN ĐOẠN */}
              <TableCell className="align-top">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 space-y-2">
                    {/* Trình chiếu video */}
                    <div className="h-24 w-full flex justify-center items-center bg-gray-50 rounded-md overflow-hidden">
                      {segment.video_path ? (
                        <div
                          className="relative w-full h-full cursor-pointer"
                          onClick={() => setModalVideo({ url: segment.video_path as string, type: "video/mp4" })}
                        >
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded hover:bg-opacity-20 transition-opacity cursor-pointer">
                            <Play className="w-8 h-8 text-white opacity-80" />
                          </div>
                          <video
                            src={segment.video_path}
                            className="w-full h-full object-cover"
                            poster={segment.direct_image_url}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Video className="w-8 h-8 mb-1" />
                          <span className="text-xs">Chưa có video</span>
                        </div>
                      )}
                    </div>

                    {/* Các nút chức năng liên quan tới video */}
                    {editable && (
                      <div className="flex flex-wrap gap-1">
                        {segment.voice_url || segment.voice_path ? (
                          <button
                            onClick={() => onCreateSegmentVideo?.(idx, "basic")}
                            disabled={isLoading || (!segment.direct_image_url && !segment.imageUrl && !segment.image_path)}
                            className="w-full px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Workflow className="w-3 h-3 mr-1" />
                            Tạo video
                          </button>
                        ) : (
                          <div className="w-full px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded flex items-center justify-center opacity-75">
                            <Info className="w-3 h-3 mr-1" />
                            Cần giọng đọc trước
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TableCell>

              {/* THAO TÁC */}
              {editable && (
                <TableCell className="align-top text-center">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => onAddSegment?.(idx + 1)}
                      className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                      title="Thêm phân cảnh mới sau phân cảnh này"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Component phát audio bảo mật
const SecureAudio = ({ url }: { url: string | undefined }) => {
  const { getSecureUrl } = useSecureMedia();
  // Đảm bảo url luôn là string trước khi sử dụng
  const secureUrl = url ? getSecureUrl(url) : '';

  if (!url) {
    return (
      <div className="h-8 flex items-center justify-center bg-gray-50 rounded text-xs text-gray-500">
        URL không hợp lệ
      </div>
    );
  }

  return (
    <audio src={secureUrl} controls className="w-full h-8 rounded-md" preload="metadata" />
  );
};

// Component thumbnail video bảo mật
const SecureVideoThumb = ({ url, poster }: { url: string, poster: string }) => {
  const { getSecureUrl } = useSecureMedia();
  const secureUrl = getSecureUrl(url);

  return (
    <div className="relative w-full h-full">
      <video 
        src={secureUrl}
        poster={poster}
        className="w-full h-full object-cover rounded"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded hover:bg-opacity-20 transition-opacity cursor-pointer">
        <Play className="w-8 h-8 text-white opacity-80" />
      </div>
    </div>
  );
};

// Component preview ảnh bảo mật
const SecureImagePreview = ({ url, fallback, idx, onRemoveImage, editable }: { 
  url?: string, 
  fallback?: string, 
  idx: number, 
  onRemoveImage?: (idx: number) => void, 
  editable: boolean 
}) => {
  const { getSecureUrl } = useSecureMedia();
  const imageUrl = url ? getSecureUrl(url) : fallback;

  return (
    <div className="relative w-full h-full group">
      {imageUrl ? (
        <>
          <Image 
            src={imageUrl} 
            alt={`Image ${idx + 1}`} 
            fill 
            className="object-cover rounded-md" 
          />
          {editable && onRemoveImage && (
            <button
              onClick={() => onRemoveImage(idx)}
              className="absolute top-1 right-1 p-1 bg-white bg-opacity-80 rounded-full text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Xóa hình ảnh"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default StoryboardTable;