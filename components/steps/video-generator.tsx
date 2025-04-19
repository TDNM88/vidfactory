"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GradientButton } from "../ui-custom/gradient-button";
import { OutlineButton } from "../ui-custom/outline-button";
import { motion } from "framer-motion";
import { Sparkles, ImageIcon, Volume2, Video, Download, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type SessionData = {
  session_id?: string;
  script: Script;
  videoUrl?: string;
};

type Segment = {
  script: string;
  prompt?: string;
  image_path?: string;
  direct_image_url?: string;
  image_description?: string;
  audio_path?: string;
};

type Script = {
  title: string;
  segments: Segment[];
};

export function VideoGenerator() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState("1-2 phút");
  const [platform, setPlatform] = useState("Facebook");
  const [feedback, setFeedback] = useState("");
  const [progressImages, setProgressImages] = useState<{ [key: number]: string }>({});
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null);
  const [generatingVoiceIndex, setGeneratingVoiceIndex] = useState<number | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Tạo kịch bản
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
      if (data.success) {
        setSessionData({ session_id: data.session_id, script: data.script });
        setExpandedStep(1);
        toast({ title: "Thành công", description: "Kịch bản đã được tạo", variant: "default" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error generating script:", error);
      toast({ title: "Lỗi", description: "Không thể tạo kịch bản", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật kịch bản
  const handleUpdateScript = async () => {
    if (!sessionData || !feedback) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/update-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: sessionData.script, feedback }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionData({ ...sessionData, script: data.script });
        setFeedback("");
        toast({ title: "Thành công", description: "Kịch bản đã được cập nhật", variant: "default" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error updating script:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật kịch bản", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo hình ảnh
  const handleGenerateImages = async () => {
    if (!sessionData?.script) return;

    setIsLoading(true);
    setProgressImages({});

    try {
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: sessionData.script }),
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
              setSessionData((prev) => ({
                ...prev!,
                script: {
                  ...prev!.script,
                  segments: prev!.script.segments.map((seg, idx) =>
                    idx === data.index ? { ...seg, image_path: data.image_path, direct_image_url: data.direct_image_url } : seg
                  ),
                },
              }));
              setProgressImages((prev) => ({ ...prev, [data.index]: "Hoàn thành" }));
              break;
            case "error":
              setProgressImages((prev) => ({ ...prev, [data.index]: data.message }));
              toast({ title: "Lỗi", description: data.message, variant: "destructive" });
              break;
            case "complete":
              setExpandedStep(2);
              toast({ title: "Thành công", description: "Tất cả ảnh đã được tạo", variant: "default" });
              break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating images:", error);
      toast({ title: "Lỗi", description: "Không thể tạo ảnh", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateImage = async (index: number) => {
    if (!sessionData?.script) return;

    setRegeneratingImageIndex(index);
    try {
      const segment = sessionData.script.segments[index];
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: { ...sessionData.script, segments: [{ ...segment, prompt: segment.prompt || segment.script }] },
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const data = JSON.parse(chunk.split("\n")[0]);

        if (data.type === "image") {
          setSessionData((prev) => ({
            ...prev!,
            script: {
              ...prev!.script,
              segments: prev!.script.segments.map((seg, idx) =>
                idx === index ? { ...seg, image_path: data.image_path, direct_image_url: data.direct_image_url } : seg
              ),
            },
          }));
          setProgressImages((prev) => ({ ...prev, [index]: "Hoàn thành" }));
          toast({ title: "Thành công", description: "Tạo lại ảnh thành công", variant: "default" });
        }
      }
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast({ title: "Lỗi", description: "Không thể tạo lại ảnh", variant: "destructive" });
    } finally {
      setRegeneratingImageIndex(null);
    }
  };

  // Tạo giọng nói
  const handleGenerateVoice = async (segment: Segment, index: number) => {
    setGeneratingVoiceIndex(index);
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: segment.script, voiceId: "vi-VN-HoaiMyNeural" }),
      });

      const data = await response.json();
      if (!data.success || !data.audioUrl) throw new Error(data.error || "Failed to generate voice");

      setSessionData((prev) => ({
        ...prev!,
        script: {
          ...prev!.script,
          segments: prev!.script.segments.map((s, idx) =>
            idx === index ? { ...s, audio_path: data.audioUrl } : s
          ),
        },
      }));
      toast({ title: "Thành công", description: "Tạo giọng nói thành công", variant: "default" });
    } catch (error) {
      console.error("Voice generation error:", error);
      toast({ title: "Lỗi", description: "Không thể tạo giọng nói", variant: "destructive" });
    } finally {
      setGeneratingVoiceIndex(null);
      setIsLoading(false);
    }
  };

  // Ghép video
  const handleCreateVideo = async () => {
    if (!sessionData?.script || !sessionData.script.segments.every((seg) => seg.image_path && seg.audio_path)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng tạo đầy đủ ảnh và giọng nói cho tất cả phân đoạn trước khi ghép video",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: sessionData.script }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionData((prev) => ({ ...prev!, videoUrl: data.videoUrl }));
        setVideoPreview(data.videoUrl);
        setExpandedStep(3);
        toast({ title: "Thành công", description: "Video đã được tạo", variant: "default" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error creating video:", error);
      toast({ title: "Lỗi", description: "Không thể tạo video", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Bước 1: Tạo kịch bản */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(0)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Bước 1: Tạo kịch bản
          </h2>
          <span className="text-sm text-gray-500">{sessionData?.script ? "✓ Hoàn thành" : "Chưa bắt đầu"}</span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 0 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 0 ? "visible" : "hidden"}
        >
          {!sessionData?.script ? (
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Tiêu đề: {sessionData.script.title}</h3>
                {sessionData.script.segments.map((seg, idx) => (
                  <p key={idx} className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Phân đoạn {idx + 1}:</span> {seg.script}
                  </p>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Phản hồi chỉnh sửa</Label>
                <Textarea
                  id="feedback"
                  placeholder="Nhập phản hồi để chỉnh sửa kịch bản"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <GradientButton
                  onClick={handleUpdateScript}
                  className="flex-1"
                  disabled={!feedback || isLoading}
                  isLoading={isLoading}
                  loadingText="Đang cập nhật..."
                >
                  Cập nhật kịch bản
                </GradientButton>
                <GradientButton onClick={() => setExpandedStep(1)} className="flex-1">
                  Tiếp tục
                </GradientButton>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Bước 2: Tạo hình ảnh */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(1)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-primary" />
            Bước 2: Tạo hình ảnh
          </h2>
          <span className="text-sm text-gray-500">
            {sessionData?.script?.segments.every((seg) => seg.direct_image_url) ? "✓ Hoàn thành" : "Chưa bắt đầu"}
          </span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 1 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 1 ? "visible" : "hidden"}
        >
          {sessionData?.script && (
            <>
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
                    <div className="mt-2 flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerateImage(index)}
                        disabled={regeneratingImageIndex === index || isLoading}
                      >
                        {regeneratingImageIndex === index ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Tạo lại ảnh
                      </Button>
                    </div>
                    {progressImages[index] && (
                      <p className="text-xs text-gray-500 text-center mt-1">{progressImages[index]}</p>
                    )}
                  </div>
                </div>
              ))}
              <GradientButton
                onClick={handleGenerateImages}
                className="w-full"
                disabled={isLoading}
                isLoading={isLoading}
                loadingText="Đang tạo ảnh..."
              >
                Tạo tất cả ảnh
              </GradientButton>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Bước 3: Tạo giọng nói */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(2)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <Volume2 className="h-5 w-5 mr-2 text-primary" />
            Bước 3: Tạo giọng nói
          </h2>
          <span className="text-sm text-gray-500">
            {sessionData?.script?.segments.every((seg) => seg.audio_path) ? "✓ Hoàn thành" : "Chưa bắt đầu"}
          </span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 2 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 2 ? "visible" : "hidden"}
        >
          {sessionData?.script && (
            <>
              {sessionData.script.segments.map((segment, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Phân đoạn {index + 1}:</span> {segment.script}
                    </p>
                    {segment.audio_path && (
                      <audio controls className="mt-2 w-full">
                        <source src={segment.audio_path} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                  <div className="w-full md:w-64">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateVoice(segment, index)}
                      disabled={generatingVoiceIndex === index || isLoading}
                      className="w-full"
                    >
                      {generatingVoiceIndex === index ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Volume2 className="h-4 w-4 mr-2" />
                      )}
                      {segment.audio_path ? "Tạo lại giọng" : "Tạo giọng nói"}
                    </Button>
                  </div>
                </div>
              ))}
              <GradientButton
                onClick={() => setExpandedStep(3)}
                className="w-full"
                disabled={!sessionData.script.segments.every((seg) => seg.audio_path)}
              >
                Tiếp tục
              </GradientButton>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Bước 4: Ghép và xuất video */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(3)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <Video className="h-5 w-5 mr-2 text-primary" />
            Bước 4: Ghép và xuất video
          </h2>
          <span className="text-sm text-gray-500">
            {sessionData?.videoUrl ? "✓ Hoàn thành" : "Chưa bắt đầu"}
          </span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 3 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 3 ? "visible" : "hidden"}
        >
          {sessionData?.script && (
            <>
              {videoPreview ? (
                <div className="space-y-4">
                  <video controls className="w-full rounded-lg">
                    <source src={videoPreview} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <Button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = videoPreview;
                      link.download = `${sessionData.script.title}.mp4`;
                      link.click();
                    }}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Tải video
                  </Button>
                </div>
              ) : (
                <GradientButton
                  onClick={handleCreateVideo}
                  className="w-full"
                  disabled={isLoading}
                  isLoading={isLoading}
                  loadingText="Đang ghép video..."
                >
                  Ghép video
                </GradientButton>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GradientButton } from "../ui-custom/gradient-button";
import { OutlineButton } from "../ui-custom/outline-button";
import { motion } from "framer-motion";
import { Sparkles, ImageIcon, Volume2, Video, Download, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type SessionData = {
  session_id?: string;
  script: Script;
  videoUrl?: string;
};

type Segment = {
  script: string;
  prompt?: string;
  image_path?: string;
  direct_image_url?: string;
  image_description?: string;
  audio_path?: string;
};

type Script = {
  title: string;
  segments: Segment[];
};

export function VideoGenerator() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState("1-2 phút");
  const [platform, setPlatform] = useState("Facebook");
  const [feedback, setFeedback] = useState("");
  const [progressImages, setProgressImages] = useState<{ [key: number]: string }>({});
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null);
  const [generatingVoiceIndex, setGeneratingVoiceIndex] = useState<number | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Tạo kịch bản
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
      if (data.success) {
        setSessionData({ session_id: data.session_id, script: data.script });
        setExpandedStep(1);
        toast({ title: "Thành công", description: "Kịch bản đã được tạo", variant: "default" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error generating script:", error);
      toast({ title: "Lỗi", description: "Không thể tạo kịch bản", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật kịch bản
  const handleUpdateScript = async () => {
    if (!sessionData || !feedback) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/update-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: sessionData.script, feedback }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionData({ ...sessionData, script: data.script });
        setFeedback("");
        toast({ title: "Thành công", description: "Kịch bản đã được cập nhật", variant: "default" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error updating script:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật kịch bản", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo tất cả hình ảnh bằng Google Gemini API
  const handleGenerateImages = async () => {
    if (!sessionData?.script) return;

    setIsLoading(true);
    setProgressImages({});

    try {
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: sessionData.script }),
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
              setSessionData((prev) => ({
                ...prev!,
                script: {
                  ...prev!.script,
                  segments: prev!.script.segments.map((seg, idx) =>
                    idx === data.index ? { ...seg, image_path: data.image_path, direct_image_url: data.direct_image_url } : seg
                  ),
                },
              }));
              setProgressImages((prev) => ({ ...prev, [data.index]: "Hoàn thành" }));
              break;
            case "error":
              setProgressImages((prev) => ({ ...prev, [data.index]: data.message }));
              toast({ title: "Lỗi", description: data.message, variant: "destructive" });
              break;
            case "complete":
              setExpandedStep(2);
              toast({ title: "Thành công", description: "Tất cả ảnh đã được tạo", variant: "default" });
              break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating images:", error);
      toast({ title: "Lỗi", description: "Không thể tạo ảnh", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo lại ảnh cho một segment
  const handleRegenerateImage = async (index: number) => {
    if (!sessionData?.script) return;

    setRegeneratingImageIndex(index);
    setProgressImages((prev) => ({ ...prev, [index]: "Đang tạo lại..." }));

    try {
      const segment = sessionData.script.segments[index];
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: { ...sessionData.script, segments: [{ ...segment, prompt: segment.prompt || segment.script }] },
        }),
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
          if (data.type === "image") {
            setSessionData((prev) => ({
              ...prev!,
              script: {
                ...prev!.script,
                segments: prev!.script.segments.map((seg, idx) =>
                  idx === index ? { ...seg, image_path: data.image_path, direct_image_url: data.direct_image_url } : seg
                ),
              },
            }));
            setProgressImages((prev) => ({ ...prev, [index]: "Hoàn thành" }));
            toast({ title: "Thành công", description: "Tạo lại ảnh thành công", variant: "default" });
          } else if (data.type === "error") {
            setProgressImages((prev) => ({ ...prev, [index]: data.message }));
            toast({ title: "Lỗi", description: data.message, variant: "destructive" });
          }
        }
      }
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast({ title: "Lỗi", description: "Không thể tạo lại ảnh", variant: "destructive" });
    } finally {
      setRegeneratingImageIndex(null);
    }
  };

  // Tạo giọng nói
  const handleGenerateVoice = async (segment: Segment, index: number) => {
    setGeneratingVoiceIndex(index);
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: segment.script, voiceId: "vi-VN-HoaiMyNeural" }),
      });

      const data = await response.json();
      if (!data.success || !data.audioUrl) throw new Error(data.error || "Failed to generate voice");

      setSessionData((prev) => ({
        ...prev!,
        script: {
          ...prev!.script,
          segments: prev!.script.segments.map((s, idx) =>
            idx === index ? { ...s, audio_path: data.audioUrl } : s
          ),
        },
      }));
      toast({ title: "Thành công", description: "Tạo giọng nói thành công", variant: "default" });
    } catch (error) {
      console.error("Voice generation error:", error);
      toast({ title: "Lỗi", description: "Không thể tạo giọng nói", variant: "destructive" });
    } finally {
      setGeneratingVoiceIndex(null);
      setIsLoading(false);
    }
  };

  // Ghép video
  const handleCreateVideo = async () => {
    if (!sessionData?.script || !sessionData.script.segments.every((seg) => seg.image_path && seg.audio_path)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng tạo đầy đủ ảnh và giọng nói cho tất cả phân đoạn trước khi ghép video",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: sessionData.script }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionData((prev) => ({ ...prev!, videoUrl: data.videoUrl }));
        setVideoPreview(data.videoUrl);
        setExpandedStep(3);
        toast({ title: "Thành công", description: "Video đã được tạo", variant: "default" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error creating video:", error);
      toast({ title: "Lỗi", description: "Không thể tạo video", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Bước 1: Tạo kịch bản */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(0)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Bước 1: Tạo kịch bản
          </h2>
          <span className="text-sm text-gray-500">{sessionData?.script ? "✓ Hoàn thành" : "Chưa bắt đầu"}</span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 0 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 0 ? "visible" : "hidden"}
        >
          {!sessionData?.script ? (
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Tiêu đề: {sessionData.script.title}</h3>
                {sessionData.script.segments.map((seg, idx) => (
                  <p key={idx} className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Phân đoạn {idx + 1}:</span> {seg.script}
                  </p>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Phản hồi chỉnh sửa</Label>
                <Textarea
                  id="feedback"
                  placeholder="Nhập phản hồi để chỉnh sửa kịch bản"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <GradientButton
                  onClick={handleUpdateScript}
                  className="flex-1"
                  disabled={!feedback || isLoading}
                  isLoading={isLoading}
                  loadingText="Đang cập nhật..."
                >
                  Cập nhật kịch bản
                </GradientButton>
                <GradientButton onClick={() => setExpandedStep(1)} className="flex-1">
                  Tiếp tục
                </GradientButton>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Bước 2: Tạo hình ảnh */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(1)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-primary" />
            Bước 2: Tạo hình ảnh
          </h2>
          <span className="text-sm text-gray-500">
            {sessionData?.script?.segments.every((seg) => seg.direct_image_url) ? "✓ Hoàn thành" : "Chưa bắt đầu"}
          </span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 1 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 1 ? "visible" : "hidden"}
        >
          {sessionData?.script && (
            <>
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
                    <div className="mt-2 flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerateImage(index)}
                        disabled={regeneratingImageIndex === index || isLoading}
                      >
                        {regeneratingImageIndex === index ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Tạo lại ảnh
                      </Button>
                    </div>
                    {progressImages[index] && (
                      <p className="text-xs text-gray-500 text-center mt-1">{progressImages[index]}</p>
                    )}
                  </div>
                </div>
              ))}
              <GradientButton
                onClick={handleGenerateImages}
                className="w-full"
                disabled={isLoading}
                isLoading={isLoading}
                loadingText="Đang tạo ảnh với Gemini..."
              >
                Tạo tất cả ảnh
              </GradientButton>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Bước 3: Tạo giọng nói */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(2)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <Volume2 className="h-5 w-5 mr-2 text-primary" />
            Bước 3: Tạo giọng nói
          </h2>
          <span className="text-sm text-gray-500">
            {sessionData?.script?.segments.every((seg) => seg.audio_path) ? "✓ Hoàn thành" : "Chưa bắt đầu"}
          </span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 2 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 2 ? "visible" : "hidden"}
        >
          {sessionData?.script && (
            <>
              {sessionData.script.segments.map((segment, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Phân đoạn {index + 1}:</span> {segment.script}
                    </p>
                    {segment.audio_path && (
                      <audio controls className="mt-2 w-full">
                        <source src={segment.audio_path} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                  <div className="w-full md:w-64">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateVoice(segment, index)}
                      disabled={generatingVoiceIndex === index || isLoading}
                      className="w-full"
                    >
                      {generatingVoiceIndex === index ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Volume2 className="h-4 w-4 mr-2" />
                      )}
                      {segment.audio_path ? "Tạo lại giọng" : "Tạo giọng nói"}
                    </Button>
                  </div>
                </div>
              ))}
              <GradientButton
                onClick={() => setExpandedStep(3)}
                className="w-full"
                disabled={!sessionData.script.segments.every((seg) => seg.audio_path)}
              >
                Tiếp tục
              </GradientButton>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Bước 4: Ghép và xuất video */}
      <motion.div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => setExpandedStep(3)}
        >
          <h2 className="text-xl font-semibold flex items-center">
            <Video className="h-5 w-5 mr-2 text-primary" />
            Bước 4: Ghép và xuất video
          </h2>
          <span className="text-sm text-gray-500">
            {sessionData?.videoUrl ? "✓ Hoàn thành" : "Chưa bắt đầu"}
          </span>
        </div>
        <motion.div
          className={cn("p-4 space-y-6", expandedStep !== 3 && "hidden")}
          variants={stepVariants}
          initial="hidden"
          animate={expandedStep === 3 ? "visible" : "hidden"}
        >
          {sessionData?.script && (
            <>
              {videoPreview ? (
                <div className="space-y-4">
                  <video controls className="w-full rounded-lg">
                    <source src={videoPreview} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <Button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = videoPreview;
                      link.download = `${sessionData.script.title}.mp4`;
                      link.click();
                    }}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Tải video
                  </Button>
                </div>
              ) : (
                <GradientButton
                  onClick={handleCreateVideo}
                  className="w-full"
                  disabled={isLoading}
                  isLoading={isLoading}
                  loadingText="Đang ghép video..."
                >
                  Ghép video
                </GradientButton>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}