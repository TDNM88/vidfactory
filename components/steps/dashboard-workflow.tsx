import React, { useState, useRef, useEffect } from "react";

import { ViduVideoStatus } from "./vidu-video-status";
import FinalScriptStep from "./final-script-step";
import ImageGenerator from "./image-generator";
import VoiceGenerator from "./voice-generator";
import VideoAssembler from "./video-assembler";
import { GradientButton } from "../ui-custom/gradient-button";
import { OutlineButton } from "../ui-custom/outline-button";
import { Modal } from "../ui-custom/modal";
import type { SessionData } from "../video-generator";
import FinalVideoResult from "./final-video-result";

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
  // State cho video tổng hợp cuối cùng
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>("");
  const [showFinalResult, setShowFinalResult] = useState(false);

  // Hàm tạo video tổng hợp từ các phân đoạn
  async function handleCreateFinalVideo() {
    setIsLoading(true);
    setShowFinalResult(false);
    try {
      const videoFiles = (sessionData.script.segments || [])
        .map((seg: any) => seg.video_path)
        .filter((v: string | undefined) => !!v);
      if (!videoFiles.length) {
        alert("Chưa có đủ video phân đoạn!");
        setIsLoading(false);
        return;
      }
      // Có thể bổ sung chọn nhạc nền nếu muốn
      const res = await fetch("/api/concat-videos-with-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoFiles }),
      });
      const data = await res.json();
      if (data.success && data.videoUrl) {
        setFinalVideoUrl(data.videoUrl);
        setShowFinalResult(true);
      } else {
        alert(data.error || "Lỗi không xác định khi ghép video");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi không xác định khi ghép video");
    } finally {
      setIsLoading(false);
    }
  }
  const [locked, setLocked] = useState(false);
  const [step, setStep] = useState<"script"|"image"|"voice"|"music"|"video"|"done">("script");
  const [showVideoModeDialog, setShowVideoModeDialog] = useState(false);
  const isFirstMount = useRef(true);
  const [videoMode, setVideoMode] = useState<"vidu"|"basic"|null>(null);

  // Đồng bộ state khi nhận props mới (ví dụ: nhận storyboard từ backend)
  useEffect(() => {
    _setSessionData(initialSessionData);
    // Chỉ set bước khi lần đầu mount (tránh reset step khi update sessionData do upload/generate ảnh)
    if (isFirstMount.current) {
      if ((initialSessionData as any).locked || (initialSessionData as any).script?.locked) {
        setLocked(true);
        setStep("video");
      } else {
        setLocked(false);
        setStep("script");
      }
      isFirstMount.current = false;
    } else {
      // chỉ cập nhật locked, không reset step
      if ((initialSessionData as any).locked || (initialSessionData as any).script?.locked) {
        setLocked(true);
      } else {
        setLocked(false);
      }
    }
  }, [initialSessionData]);

  // Gán lại sessionData cho toàn bộ flow
  const updateSessionData = (data: SessionData) => {
    _setSessionData(data);
    setSessionData(data);
  };

  // Xác nhận script
  // Xác nhận script với script mới nhất truyền vào
  const handleConfirmScript = (latestScript: any) => {
    setLocked(true);
    updateSessionData({
      ...sessionData,
      script: { ...latestScript, locked: true },
    });
    // Đảm bảo chuyển bước sau khi cập nhật sessionData (dùng setTimeout để tránh race condition với setState)
    setTimeout(() => {
      setStep("image");
    }, 0);
  };

  // Xác nhận xong ảnh minh họa thì mới cho chọn mode tạo video
  const handleConfirmImage = () => {
    setShowVideoModeDialog(true);
  };

  const handleSelectVideoMode = (mode: "vidu" | "basic") => {
    setVideoMode(mode);
    setShowVideoModeDialog(false);
    setStep("video");
  };

  // Xác nhận voice
  const handleConfirmVoice = () => {
    setStep("music");
  };

  // Xác nhận nhạc nền
  const handleConfirmMusic = () => {
    setStep("done");
  };

  // Tạo video từng phân đoạn (chỉ còn VIDU)
  const handleCreateVideoVIDU = (idx: number) => {
    alert(`Tạo video qua VIDU cho phân đoạn ${idx + 1}`);
    // TODO: Gọi API tạo video qua VIDU
  };


  // Hiển thị bảng điều khiển tổng hợp
  return (
    <div className="dashboard-workflow space-y-8 p-6 bg-white/80 rounded-xl shadow-xl max-w-5xl mx-auto">
      <Modal open={showVideoModeDialog} onClose={() => setShowVideoModeDialog(false)}>
        <div className="flex flex-col gap-4 items-center">
          <h3 className="text-xl font-bold mb-2">Chọn phương thức tạo video</h3>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold w-full"
            onClick={() => handleSelectVideoMode("vidu")}
          >
            Tạo video với VIDU (AI)
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold w-full"
            onClick={() => handleSelectVideoMode("basic")}
          >
            Tạo video cơ bản (ảnh + giọng đọc)
          </button>
        </div>
      </Modal>
      {/* Nút quay lại giao diện nhập input */}
      <button
        className="mb-4 px-3 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition border border-gray-300"
        onClick={() => {
          window.location.reload();
        }}
      >
        ← Quay lại nhập yêu cầu ban đầu
      </button>
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
      </div> {/* đóng grid tổng quan */}
      {/* 1. Kịch bản & minh họa */}
      <section>
        {showFinalResult ? (
          <FinalVideoResult
            videoUrl={finalVideoUrl}
            onBack={() => setShowFinalResult(false)}
          />
        ) : step === "script" && (
          <>
            <FinalScriptStep
              sessionData={sessionData}
              setSessionData={updateSessionData}
              onNext={() => setStep("image")}
              onPrevious={() => setStep("script")}
            />
            <button
              className={`mt-4 px-4 py-2 rounded font-semibold text-white ${sessionData.script.segments.every(seg => seg.video_path) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
              disabled={!sessionData.script.segments.every(seg => seg.video_path)}
              title={sessionData.script.segments.every(seg => seg.video_path) ? '' : 'Cần tạo video cho tất cả các phân đoạn để tạo video kết quả cuối cùng'}
              onClick={handleCreateFinalVideo}
            >
              Tạo video kết quả cuối cùng
            </button>
          </>
        )}
        {step === "image" && (
          <>
            <ImageGenerator
              sessionData={sessionData}
              setSessionData={updateSessionData}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
              locked={locked}
              onNext={() => {}}
              onPrevious={() => {}}
            />
            <GradientButton className="mt-4" onClick={handleConfirmImage}>
              Xác nhận ảnh minh họa
            </GradientButton>
          </>
        )}
      </section>

      

      {/* 3. Chọn mode tạo video sau khi đã xác nhận ảnh */}
      {showVideoModeDialog && (
        <Modal open={showVideoModeDialog} onClose={() => setShowVideoModeDialog(false)}>
          <div className="flex flex-col gap-4 items-center">
            <h3 className="text-xl font-bold mb-2">Chọn phương thức tạo video</h3>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold w-full"
              onClick={() => handleSelectVideoMode("vidu")}
            >
              Tạo video với VIDU (AI)
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold w-full"
              onClick={() => handleSelectVideoMode("basic")}
            >
              Tạo video cơ bản (ảnh + giọng đọc)
            </button>
          </div>
        </Modal>
      )}

      {/* 4. Video từng phân đoạn theo mode đã chọn */}
      {step === "video" && videoMode === "vidu" && (
        <section className="mt-8">
          <button
            className="mb-4 px-3 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition border border-gray-300"
            onClick={() => { setVideoMode(null); setShowVideoModeDialog(true); }}
          >
            Quay lại
          </button>
          <h3 className="font-semibold text-lg mb-2 text-primary">Tạo video từ storyboard (AI VIDU)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionData.script.segments.map((seg, idx) => (
              <div key={idx} className="rounded-xl shadow bg-white p-4 border border-gray-200">
                <div className="font-bold text-primary mb-1">Phân đoạn {idx + 1}</div>
                <div className="mb-2">
                  <div className="bg-gray-50 rounded px-2 py-1 text-gray-900 whitespace-pre-line mb-2">
                    {seg.script}
                  </div>
                  {seg.direct_image_url || seg.image_path ? (
                    <img
                      src={seg.direct_image_url || seg.image_path}
                      alt={"Ảnh minh họa phân đoạn " + (idx + 1)}
                      className="w-full max-h-40 object-contain rounded mb-2"
                    />
                  ) : (
                    <div className="text-gray-400 italic mb-2">Chưa có ảnh</div>
                  )}
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {(seg.direct_image_url || seg.image_path) ? (
                    <ViduVideoStatus
                      segmentIdx={idx}
                      imageUrl={seg.direct_image_url || seg.image_path || ''}
                      prompt={seg.image_description}
                      onSuccess={(videoUrl: string) => {
                        // Cập nhật direct_video_url cho phân đoạn
                        const newSegments = sessionData.script.segments.map((s, i) =>
                          i === idx ? { ...s, direct_video_url: videoUrl } : s
                        );
                        updateSessionData({ ...sessionData, script: { ...sessionData.script, segments: newSegments } });
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 italic">Cần có ảnh minh họa để tạo video</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BASIC: Video cơ bản - mỗi phân đoạn có nút tạo video cơ bản, chọn giọng đọc và tạo voice */}
      {step === "video" && videoMode === "basic" && (
        <section className="mt-8">
          <button
            className="mb-4 px-3 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition border border-gray-300"
            onClick={() => { setVideoMode(null); setShowVideoModeDialog(true); }}
          >
            Quay lại
          </button>
          <h3 className="font-semibold text-lg mb-2 text-primary">Tạo video cơ bản từ storyboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionData.script.segments.map((seg, idx) => (
              <div key={idx} className="rounded-xl shadow bg-white p-4 border border-gray-200">
                <div className="font-bold text-primary mb-1">Phân đoạn {idx + 1}</div>
                <div className="mb-2">
                  <div className="bg-gray-50 rounded px-2 py-1 text-gray-900 whitespace-pre-line mb-2">
                    {seg.script}
                  </div>
                  {seg.direct_image_url || seg.image_path ? (
                    <img
                      src={seg.direct_image_url || seg.image_path}
                      alt={"Ảnh minh họa phân đoạn " + (idx + 1)}
                      className="w-full max-h-40 object-contain rounded mb-2"
                    />
                  ) : (
                    <div className="text-gray-400 italic mb-2">Chưa có ảnh</div>
                  )}
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {/* Nút tạo video cơ bản */}
                  {(seg.direct_image_url || seg.image_path) ? (
                    <button
                      className="px-3 py-2 rounded bg-green-100 text-green-800 font-semibold hover:bg-green-200 transition"
                      onClick={() => alert('TODO: Gọi API tạo video cơ bản cho phân đoạn ' + (idx + 1))}
                    >
                      Tạo video cơ bản
                    </button>
                  ) : (
                    <div className="text-gray-400 italic">Cần có ảnh minh họa để tạo video</div>
                  )}
                  {/* Chọn giọng đọc và tạo voice */}
                  <VoiceGenerator
                    sessionData={sessionData}
                    setSessionData={updateSessionData}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                    onNext={() => {}}
                    onPrevious={() => {}}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Giọng nói từng phân đoạn */}
      {locked && sessionData.script.segments.every(seg => seg.direct_image_url || seg.image_path) && (
        <section className="mt-8">
          
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
      /* ensure all sections/fragments above are correctly closed before this line */
        && sessionData.script.segments.every(seg => seg.direct_voice_url)
        && sessionData.script.video_path && (
        <div className="text-green-700 font-bold text-xl text-center py-10">
          Video đã hoàn thành! Bạn có thể tải về hoặc chỉnh sửa lại các bước.
        </div>
      )}
    </div>
  );
}
