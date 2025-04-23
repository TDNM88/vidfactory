import React, { useState } from "react";

interface ViduVideoStatusProps {
  segmentIdx: number;
  imageUrl: string;
  prompt?: string;
  onSuccess: (videoUrl: string) => void;
}

export function ViduVideoStatus({ segmentIdx, imageUrl, prompt, onSuccess }: ViduVideoStatusProps) {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    setStatus("Đang gửi yêu cầu tạo video...");
    try {
      // Gửi yêu cầu tạo video qua API Next.js (chuẩn hóa backend)
      setVideoUrl(null); // reset nếu tạo lại
      const res = await fetch("/api/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vidu_image: imageUrl, // truyền url hoặc base64
          platform_width: 720, // TODO: truyền đúng width thực tế từ props nếu cần
          platform_height: 1280, // TODO: truyền đúng height thực tế từ props nếu cần
          prompt: prompt || ""
        })
      });
      const data = await res.json();
      if (!res.ok || !data.task_id) {
        throw new Error(data.error || "Không tạo được video VIDU");
      }
      setStatus("Đang chờ video hoàn thành (task_id: " + data.task_id + ")...");
      // Poll trạng thái task (giả lập: 5s/lần, 12 lần tối đa)
      let pollCount = 0;
      let videoUrlResult = "";
      while (pollCount < 12) {
        await new Promise(r => setTimeout(r, 5000));
        pollCount++;
        const pollRes = await fetch(`/api/vidu-task-status?task_id=${data.task_id}`);
        const pollData = await pollRes.json();
        if (pollData.state === "SUCCESS" && pollData.video_url) {
          videoUrlResult = pollData.video_url;
          break;
        }
        if (pollData.state === "FAILURE") {
          throw new Error(pollData.error || "Video VIDU thất bại");
        }
      }
      if (!videoUrlResult) throw new Error("Không lấy được video VIDU sau thời gian chờ.");
      setVideoUrl(videoUrlResult);
      setStatus("Đã tạo xong video VIDU!");
      onSuccess(videoUrlResult);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {videoUrl ? (
        <>
          <video src={videoUrl} controls className="w-full rounded" />
          <div className="text-green-700 font-semibold">Đã tạo xong video VIDU!</div>
          <button
            className="px-3 py-2 rounded bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition mt-2"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Đang tạo lại video..." : "Tạo lại video"}
          </button>
        </>
      ) : (
        <button
          className="px-3 py-2 rounded bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Đang tạo video..." : "Tạo video qua VIDU"}
        </button>
      )}
      {status && <div className="text-sm text-gray-600">{status}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
