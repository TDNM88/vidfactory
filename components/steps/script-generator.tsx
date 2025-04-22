"use client";

import { useState } from "react";
import { ScriptEditor } from "./ScriptEditor";
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
        <>
          <ScriptEditor
            script={sessionData.script}
            setScript={(script: Script) => setSessionData({ ...sessionData, script })}
          />
          <GradientButton
            onClick={async () => {
              const editor = document.activeElement as HTMLElement;
              if (editor) editor.blur();
              setIsLoading(true);
              await new Promise(r => setTimeout(r, 400)); // Hiệu ứng loading nhẹ
              setIsLoading(false);
              onNext();
            }}
            className="w-full mt-6"
            disabled={isLoading || (sessionData && sessionData.script.segments.some(seg => !seg.script.trim() || !seg.image_description.trim()))}
            isLoading={isLoading}
            loadingText="Đang xác nhận..."
          >
            Xác nhận kịch bản
          </GradientButton>
        </>
      )}
    </div>
  );
}