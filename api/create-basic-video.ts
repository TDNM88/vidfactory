// pages/api/create-basic-video.ts
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, voiceUrl, segmentIdx } = body;

    if (!imageUrl || !voiceUrl || isNaN(segmentIdx)) {
      return NextResponse.json(
        { success: false, error: "Thiếu imageUrl, voiceUrl hoặc segmentIdx không hợp lệ" },
        { status: 400 }
      );
    }

    const tempDir = join(process.cwd(), "public", "temp-videos");
    await fs.mkdir(tempDir, { recursive: true });

    const fileName = `video-${Date.now()}-${segmentIdx}`;
    const paddedImageFile = join(tempDir, `${fileName}_even.jpg`);
    const videoFile = join(tempDir, `${fileName}.mp4`);
    const videoUrl = `/temp-videos/${fileName}.mp4`;

    // Bước 1: Đảm bảo ảnh đầu vào có width/height chẵn
    await new Promise((resolve, reject) => {
      const ffmpegPad = spawn("ffmpeg", [
        "-y",
        "-i",
        join(process.cwd(), "public", imageUrl), // Chuyển URL thành đường dẫn tuyệt đối
        "-vf",
        "pad=ceil(iw/2)*2:ceil(ih/2)*2",
        paddedImageFile,
      ]);
      ffmpegPad.on("error", (err) => reject(new Error(`FFmpeg pad error: ${err.message}`)));
      ffmpegPad.on("close", (code) =>
        code === 0 ? resolve(null) : reject(new Error(`FFmpeg pad failed with code ${code}`))
      );
    });

    // Bước 2: Ghép ảnh đã chuẩn hóa và audio thành video
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-loop",
        "1",
        "-i",
        paddedImageFile,
        "-i",
        join(process.cwd(), "public", voiceUrl), // Chuyển voiceUrl thành đường dẫn tuyệt đối
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-pix_fmt",
        "yuv420p",
        videoFile,
      ]);
      ffmpeg.on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
      ffmpeg.on("close", (code) =>
        code === 0 ? resolve(null) : reject(new Error(`FFmpeg failed with code ${code}`))
      );
    });

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Error creating basic video:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi tạo video Basic" },
      { status: 500 }
    );
  }
}