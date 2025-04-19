"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "../ui-custom/gradient-button";
import { OutlineButton } from "../ui-custom/outline-button";
import { RefreshCw, Play } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { SessionData } from "../video-generator";

type VoiceGeneratorProps = {
  onNext: () => void;
  onPrevious: () => void;
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
};

export function VoiceGenerator({
  onNext,
  onPrevious,
  sessionData,
  setSessionData,
  setIsLoading,
  isLoading,
}: VoiceGeneratorProps) {
  const [progressVoices, setProgressVoices] = useState<{ [key: number]: string }>({});
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);

  const handleGenerateVoice = async (index: number) => {
    setProcessingIndex(index);
    setProgressVoices((prev) => ({ ...prev, [index]: "Đang tạo..." }));

    try {
      const script = {
        segments: [sessionData.script.segments[index]], // Chỉ gửi đoạn hiện tại
      };

      const response = await fetch("/api/generate-voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ script }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          const data = JSON.parse(line);
          switch (data.type) {
            case "progress":
              setProgressVoices((prev) => ({ ...prev, [data.index]: data.message }));
              break;
            case "voice":
              setSessionData({
                ...sessionData,
                script: {
                  ...sessionData.script,
                  segments: sessionData.script.segments.map((seg, idx) =>
                    idx === data.index
                      ? { ...seg, voice_path: data.voice_path, direct_voice_url: data.direct_voice_url }
                      : seg
                  ),
                },
              });
              setProgressVoices((prev) => ({ ...prev, [data.index]: "Hoàn thành" }));
              toast({ title: "Thành công", description: "Giọng nói đã được tạo", variant: "default" });
              break;
            case "error":
              setProgressVoices((prev) => ({ ...prev, [data.index]: data.message }));
              toast({ title: "Lỗi", description: data.message, variant: "destructive" });
              break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating voice:", error);
      toast({ title: "Lỗi", description: "Không thể tạo giọng nói", variant: "destructive" });
      setProgressVoices((prev) => ({ ...prev, [index]: "Lỗi" }));
    } finally {
      setProcessingIndex(null);
    }
  };

  const handlePlayVoice = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch((error) => {
      toast({ title: "Lỗi", description: "Không thể phát âm thanh: " + error.message, variant: "destructive" });
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bước 3: Tạo giọng nói</h2>
      {sessionData.script.segments.map((segment, index) => (
        <div key={index} className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Phân đoạn {index + 1}:</span> {segment.script}
            </p>
            {segment.image_description && (
              <p className="text-sm text-gray-500 italic mt-1">Mô tả ảnh: {segment.image_description}</p>
            )}
            {segment.direct_image_url && (
              <img
                src={segment.direct_image_url}
                alt={`Hình ảnh phân đoạn ${index + 1}`}
                className="mt-2 w-32 h-32 object-cover rounded"
              />
            )}
          </div>
          <div className="w-full md:w-64">
            <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {segment.direct_voice_url ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePlayVoice(segment.direct_voice_url)}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Phát
                </Button>
              ) : progressVoices[index] && progressVoices[index] !== "Hoàn thành" ? (
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              ) : (
                <span className="text-gray-400">Chưa có giọng nói</span>
              )}
            </div>
            <div className="mt-2 flex justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateVoice(index)}
                disabled={processingIndex === index || isLoading}
              >
                {processingIndex === index && progressVoices[index]?.includes("Đang tạo") ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Tạo giọng nói
              </Button>
            </div>
            {progressVoices[index] && (
              <p className="text-xs text-gray-500 text-center mt-1">{progressVoices[index]}</p>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <OutlineButton onClick={onPrevious} className="flex-1">
          Quay lại
        </OutlineButton>
        <GradientButton onClick={onNext} className="flex-1" disabled={isLoading}>
          Tiếp theo
        </GradientButton>
      </div>
    </div>
  );
}