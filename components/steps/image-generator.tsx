"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "../ui-custom/gradient-button";
import { OutlineButton } from "../ui-custom/outline-button";
import { RefreshCw, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { SessionData, Script } from "../video-generator";

type ImageGeneratorProps = {
  onNext: () => void;
  onPrevious: () => void;
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
};

export function ImageGenerator({
  onNext,
  onPrevious,
  sessionData,
  setSessionData,
  setIsLoading,
  isLoading,
}: ImageGeneratorProps) {
  const [progressImages, setProgressImages] = useState<{ [key: number]: string }>({});
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);

  const handleGenerateImage = async (index: number) => {
    setProcessingIndex(index);
    setProgressImages((prev) => ({ ...prev, [index]: "Đang tạo..." }));

    try {
      const segment = sessionData.script.segments[index];
      const formData = new FormData();
      formData.append("index", index.toString());
      if (segment.image_description) {
        formData.append("prompt", segment.image_description);
      }

      const response = await fetch("/api/generate-images", {
        method: "POST",
        body: formData,
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
              setProgressImages((prev) => ({ ...prev, [data.index]: data.message }));
              break;
            case "image":
              setSessionData({
                ...sessionData,
                script: {
                  ...sessionData.script,
                  segments: sessionData.script.segments.map((seg: Script["segments"][0], idx: number) =>
                    idx === data.index ? { ...seg, image_path: data.image_path, direct_image_url: data.direct_image_url } : seg
                  ),
                },
              });
              setProgressImages((prev) => ({ ...prev, [data.index]: "Hoàn thành" }));
              toast({ title: "Thành công", description: "Ảnh đã được tạo", variant: "default" });
              break;
            case "error":
              setProgressImages((prev) => ({ ...prev, [data.index]: data.message }));
              toast({ title: "Lỗi", description: data.message, variant: "destructive" });
              break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({ title: "Lỗi", description: "Không thể tạo ảnh", variant: "destructive" });
      setProgressImages((prev) => ({ ...prev, [index]: "Lỗi" }));
    } finally {
      setProcessingIndex(null);
    }
  };

  const handleUploadImage = async (index: number, file: File) => {
    setProcessingIndex(index);
    setProgressImages((prev) => ({ ...prev, [index]: "Đang tải lên..." }));

    try {
      if (file instanceof File) {
        const formData = new FormData();
        formData.append("index", index.toString());
      formData.append("file", file);

      const response = await fetch("/api/generate-images", {
        method: "POST",
        body: formData,
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
              setProgressImages((prev) => ({ ...prev, [data.index]: data.message }));
              break;
            case "image":
              setSessionData({
                ...sessionData,
                script: {
                  ...sessionData.script,
                  segments: sessionData.script.segments.map((seg: Script["segments"][0], idx: number) =>
                    idx === data.index ? { ...seg, image_path: data.image_path, direct_image_url: data.direct_image_url } : seg
                  ),
                },
              });
              setProgressImages((prev) => ({ ...prev, [data.index]: "Hoàn thành" }));
              toast({ title: "Thành công", description: "Ảnh đã được tải lên", variant: "default" });
              break;
            case "error":
              setProgressImages((prev) => ({ ...prev, [data.index]: data.message }));
              toast({ title: "Lỗi", description: data.message, variant: "destructive" });
              break;
          }
        }
      }
      } else {
        // Nếu không phải file hợp lệ, không làm gì cả hoặc có thể báo lỗi
        toast({ title: "Lỗi", description: "File không hợp lệ", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Lỗi", description: "Không thể tải ảnh lên", variant: "destructive" });
      setProgressImages((prev) => ({ ...prev, [index]: "Lỗi" }));
    } finally {
      setProcessingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bước 2: Tạo hoặc tải ảnh</h2>
      {sessionData.script.segments.map((segment, index) => (
        <div key={index} className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Phân đoạn {index + 1}:</span> {segment.script}
            </p>
            {segment.image_description && (
              <p className="text-sm text-gray-500 italic mt-1">Mô tả: {segment.image_description}</p>
            )}
          </div>
          <div className="w-full md:w-64">
            <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
              {segment.direct_image_url ? (
                <img
                  src={segment.direct_image_url}
                  alt={`Hình ảnh phân đoạn ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : progressImages[index] && progressImages[index] !== "Hoàn thành" ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Chưa có ảnh</div>
              )}
            </div>
            <div className="mt-2 flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateImage(index)}
                disabled={processingIndex === index || isLoading}
              >
                {processingIndex === index && progressImages[index]?.includes("Đang tạo") ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Tạo ảnh
              </Button>
              <label className="flex items-center">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  disabled={processingIndex === index || isLoading}
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Tải lên
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleUploadImage(index, e.target.files[0])}
                  disabled={processingIndex === index || isLoading}
                />
              </label>
            </div>
            {progressImages[index] && (
              <p className="text-xs text-gray-500 text-center mt-1">{progressImages[index]}</p>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <OutlineButton onClick={onPrevious} className="flex-1">
          Quay lại
        </OutlineButton>
        <GradientButton onClick={onNext} className="flex-1" disabled={isLoading}>
          Chuyển sang tạo voice
        </GradientButton>
      </div>
    </div>
  );
}