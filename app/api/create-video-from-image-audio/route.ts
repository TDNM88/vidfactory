import { NextResponse } from "next/server";
import { join } from "path";
import { spawn } from "child_process";
import fs from "fs";
import ffmpegStatic from "ffmpeg-static";
import { existsSync } from "fs";
import { join as joinPath } from "path";

// Ưu tiên lấy ffmpeg từ ffmpeg-bin nếu có
let ffmpegPath = joinPath(process.cwd(), "ffmpeg-bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
if (!existsSync(ffmpegPath)) {
  ffmpegPath = ffmpegStatic as string;
}


export async function POST(request: Request) {
  try {
    const { imageUrl, audioUrl } = await request.json();
    if (!imageUrl || !audioUrl) {
      return NextResponse.json({ success: false, error: "Thiếu imageUrl hoặc audioUrl" });
    }

    // Đường dẫn tuyệt đối
    const imagePath = join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
    const audioPath = join(process.cwd(), "public", audioUrl.replace(/^\//, ""));
    const fileName = `video-${Date.now()}.mp4`;
    const videoPath = join(process.cwd(), "public", "generated", fileName);
    const videoUrl = `/generated/${fileName}`;

    // Kiểm tra tồn tại
    if (!fs.existsSync(imagePath)) return NextResponse.json({ success: false, error: "Không tìm thấy ảnh" });
    if (!fs.existsSync(audioPath)) return NextResponse.json({ success: false, error: "Không tìm thấy audio" });

    // Ghép video bằng ffmpeg (ảnh tĩnh + audio)
    // ffmpeg phải được cài đặt trên máy chủ
    const ffmpegArgs = [
      "-y",
      "-loop", "1",
      "-i", imagePath,
      "-i", audioPath,
      "-c:v", "libx264",
      "-tune", "stillimage",
      "-c:a", "aac",
      "-b:a", "192k",
      "-pix_fmt", "yuv420p",
      "-shortest",
      "-movflags", "+faststart",
      videoPath,
    ];

    console.log("[API] Tạo video từ ảnh và audio:");
    console.log("  ffmpegPath:", ffmpegPath);
    console.log("  ffmpegArgs:", ffmpegArgs);

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath as string, ffmpegArgs, { stdio: "inherit" });
      ffmpeg.on("error", (err) => {
        console.error("[API] Lỗi khi chạy ffmpeg (spawn):", err);
        reject(err);
      });
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new Error("ffmpeg exited with code " + code));
      });
    });

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Lỗi khi tạo video" });
  }
}
