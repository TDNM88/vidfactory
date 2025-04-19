"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientButton } from "../ui-custom/gradient-button";
import { toast } from "@/components/ui/use-toast";
import type { SessionData, Script } from "../video-generator";

type ScriptGeneratorProps = {
  onNext: () => void;
  setSessionData: (data: SessionData | null) => void;
  sessionData: SessionData | null;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
};

export function ScriptGenerator({
  onNext,
  setSessionData,
  sessionData,
  setIsLoading,
  isLoading,
}: ScriptGeneratorProps) {
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState("1-2 phút");
  const [platform, setPlatform] = useState("Facebook");

  const handleGenerateScript = async () => {
    if (!subject || !summary) {
      toast({ title: "Lỗi", description: "Vui lòng nhập chủ đề và tóm tắt nội dung", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, summary, duration, platform }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo kịch bản");
      }

      setSessionData({ session_id: data.session_id, script: data.script });
      toast({ title: "Thành công", description: "Kịch bản đã được tạo", variant: "default" });
      onNext();
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Lỗi",
        description: (error as Error).message || "Không thể tạo kịch bản",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bước 1: Tạo kịch bản</h2>
      {!sessionData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Chủ đề</Label>
              <Input
                id="subject"
                placeholder="Nhập chủ đề video"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Nền tảng</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nền tảng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Tóm tắt nội dung</Label>
            <Textarea
              id="summary"
              placeholder="Mô tả nội dung bạn muốn thực hiện"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Độ dài video</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Chọn độ dài" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dưới 1 phút">Dưới 1 phút</SelectItem>
                <SelectItem value="1-2 phút">1-2 phút</SelectItem>
                <SelectItem value="2-3 phút">2-3 phút</SelectItem>
                <SelectItem value="3-5 phút">3-5 phút</SelectItem>
                <SelectItem value="Trên 5 phút">Trên 5 phút</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <GradientButton
            onClick={handleGenerateScript}
            className="w-full"
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Đang tạo kịch bản..."
          >
            Tạo kịch bản
          </GradientButton>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tiêu đề: {sessionData.script.title}</h3>
          {sessionData.script.segments.map((seg, idx) => (
            <div key={idx} className="text-sm text-gray-700">
              <p>
                <span className="font-medium">Phân đoạn {idx + 1}:</span> {seg.script}
              </p>
              <p className="text-gray-500 italic">Mô tả ảnh: {seg.image_description}</p>
            </div>
          ))}
          <GradientButton onClick={onNext} className="w-full">
            Tiếp tục
          </GradientButton>
        </div>
      )}
    </div>
  );
}