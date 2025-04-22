import React, { useState } from "react";
import FinalScriptEditor from "./final-script-editor";
import ImageGenerator from "./image-generator";
import VoiceGenerator from "./voice-generator";
import VideoAssembler from "./video-assembler";
import { GradientButton } from "../ui-custom/gradient-button";
import { OutlineButton } from "../ui-custom/outline-button";
import type { SessionData } from "../video-generator";

/**
 * Bảng điều khiển quy trình tạo video: hiển thị và thao tác tất cả các bước trên 1 giao diện.
 */
export function DashboardWorkflow({
  sessionData: initialSessionData,
  setSessionData,
  setIsLoading,
  isLoading,
}: {
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}) {
  // State quản lý từng phần
  const [sessionData, _setSessionData] = useState(initialSessionData);
  const [locked, setLocked] = useState(false);
  const [step, setStep] = useState<"script"|"image"|"voice"|"music"|"done">("script");

  // Gán lại sessionData cho toàn bộ flow
  const updateSessionData = (data: SessionData) => {
    _setSessionData(data);
    setSessionData(data);
  };

  // Xác nhận script
  const handleConfirmScript = () => {
    setLocked(true);
    // KHÔNG CHUYỂN BƯỚC, chỉ khóa chỉnh sửa storyboard, giữ nguyên step là 'script'
    // setStep("image");
  };


  // Xác nhận ảnh
  const handleConfirmImage = () => {
    setStep("voice");
  };

  // Xác nhận voice
  const handleConfirmVoice = () => {
    setStep("music");
  };

  // Xác nhận nhạc nền
  const handleConfirmMusic = () => {
    setStep("done");
  };

  // Hiển thị bảng điều khiển tổng hợp
  return (
    <div className="dashboard-workflow space-y-8 p-6 bg-white/80 rounded-xl shadow-xl max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Bảng điều khiển tạo video</h2>
      {/* Thông tin tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="font-bold text-gray-700 mb-1">Tiêu đề</div>
          <div className="bg-gray-100 rounded px-3 py-2">{sessionData.script.title}</div>
        </div>
        <div>
          <div className="font-bold text-gray-700 mb-1">Nền tảng</div>
          <div className="bg-gray-100 rounded px-3 py-2">{(sessionData as any).platform || (sessionData.script as any).platform || "TikTok"}</div>
        </div>
        <div>
          <div className="font-bold text-gray-700 mb-1">Thời lượng</div>
          <div className="bg-gray-100 rounded px-3 py-2">{((sessionData as any).duration || (sessionData.script as any).duration || 60) + "s"}</div>
        </div>
      </div>
      {/* 1. Kịch bản & minh họa */}
      <section>
        <FinalScriptEditor
          script={sessionData.script}
          onChange={data => updateSessionData({ ...sessionData, script: data })}
          onConfirm={handleConfirmScript}
          locked={locked}
          platform={(sessionData as any).platform || (sessionData.script as any).platform}
          duration={(sessionData as any).duration || (sessionData.script as any).duration || 60}
        />
        <div className="flex gap-4 mt-4">
          {/* Chỉ hiện nút xác nhận kịch bản khi chưa locked, không hiện cùng nút xác nhận ảnh */}
          {!locked && (
            <GradientButton onClick={handleConfirmScript}>
              Xác nhận kịch bản
            </GradientButton>
          )}
          {/* Chỉ hiện nút xác nhận ảnh khi đã locked và đủ ảnh, không hiện cùng nút xác nhận kịch bản */}
          {locked && sessionData.script.segments.every(seg => seg.direct_image_url || seg.image_path) && (
            <GradientButton className="ml-2" onClick={handleConfirmImage}>
              Xác nhận ảnh minh họa
            </GradientButton>
          )}
        </div>
      </section>

      {/* 2. Ảnh từng phân đoạn */}
      {locked && (
        <section className="mt-8">
          <h3 className="font-semibold text-lg mb-2 text-primary">2. Ảnh từng phân đoạn</h3>
          {/* Đã có logic upload/generate ảnh trong FinalScriptEditor */}
          <div className="text-gray-500 text-sm mb-2">Hãy upload hoặc tạo ảnh cho từng phân đoạn bên trên.</div>
          {sessionData.script.segments.every(seg => seg.direct_image_url || seg.image_path) && (
            <GradientButton className="mt-2" onClick={handleConfirmImage}>
              Xác nhận ảnh minh họa
            </GradientButton>
          )}
        </section>
      )}

      {/* 3. Giọng nói từng phân đoạn */}
      {locked && sessionData.script.segments.every(seg => seg.direct_image_url || seg.image_path) && (
        <section className="mt-8">
          <h3 className="font-semibold text-lg mb-2 text-primary">3. Giọng nói từng phân đoạn</h3>
          <VoiceGenerator
            sessionData={sessionData}
            setSessionData={updateSessionData}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
            onNext={() => {}}
            onPrevious={() => {}}
          />
          {sessionData.script.segments.every(seg => seg.direct_voice_url) && (
            <GradientButton className="mt-2" onClick={handleConfirmVoice}>
              Xác nhận giọng nói
            </GradientButton>
          )}
        </section>
      )}

      {/* 4. Tạo video tổng hợp */}
      {locked && sessionData.script.segments.every(seg => seg.direct_image_url || seg.image_path)
        && sessionData.script.segments.every(seg => seg.direct_voice_url) && (
        <section className="mt-8">
          <h3 className="font-semibold text-lg mb-2 text-primary">4. Tạo video tổng hợp</h3>
          <VideoAssembler
            sessionData={sessionData}
            setSessionData={updateSessionData}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
            onNext={() => {}}
            onPrevious={() => {}}
          />
          {sessionData.script.video_path && (
            <GradientButton className="mt-2" onClick={handleConfirmMusic}>
              Xác nhận video
            </GradientButton>
          )}
        </section>
      )}

      {/* 5. Hoàn thành */}
      {locked && sessionData.script.segments.every(seg => seg.direct_image_url || seg.image_path)
        && sessionData.script.segments.every(seg => seg.direct_voice_url)
        && sessionData.script.video_path && (
        <div className="text-green-700 font-bold text-xl text-center py-10">
          Video đã hoàn thành! Bạn có thể tải về hoặc chỉnh sửa lại các bước.
        </div>
      )}
    </div>
  );
}
