// pages/api/merge-video-voice.ts
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, voiceUrl, segmentIdx } = body;

    if (!videoUrl || !voiceUrl || isNaN(segmentIdx)) {
      return NextResponse.json(
        { success: false, error: "Thiếu videoUrl, voiceUrl hoặc segmentIdx không hợp lệ" },
        { status: 400 }
      );
    }

    const tempDir = join(process.cwd(), "public", "temp-videos");
    await fs.mkdir(tempDir, { recursive: true });

    const fileName = `merged-${Date.now()}-${segmentIdx}.mp4`;
    const outputFile = join(tempDir, fileName);
    const newVideoUrl = `/temp-videos/${fileName}`;

    // Ghép video và giọng đọc
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i",
        join(process.cwd(), "public", videoUrl),
        "-i",
        join(process.cwd(), "public", voiceUrl),
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        outputFile,
      ]);
      ffmpeg.on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
      ffmpeg.on("close", (code) =>
        code === 0 ? resolve(null) : reject(new Error(`FFmpeg failed with code ${code}`))
      );
    });

    return NextResponse.json({ success: true, videoUrl: newVideoUrl });
  } catch (error: any) {
    console.error("Error merging video and voice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi ghép video và giọng đọc" },
      { status: 500 }
    );
  }
}