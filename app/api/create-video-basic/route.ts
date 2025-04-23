import { NextRequest } from "next/server";
import { join } from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { spawn } from "child_process";

// Hàm gọi API tạo giọng đọc (giống generate-voice)
async function generateVoiceWithGradio({ text, outputPath, refAudioPath }: { text: string, outputPath: string, refAudioPath: string }) {
  // ... (reuse your voice synthesis logic here)
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, imageUrl, voiceName } = body;
  if (!text || !imageUrl || !voiceName) {
    return new Response(JSON.stringify({ error: 'Thiếu thông tin text, imageUrl hoặc voiceName' }), { status: 400 });
  }

  // Tạo giọng đọc
  const voicesDir = join(process.cwd(), "public", "voices");
  const refAudioPath = join(voicesDir, voiceName);
  const tempDir = join(process.cwd(), "public", "temp-videos");
  await fs.mkdir(tempDir, { recursive: true });
  const audioFile = join(tempDir, `${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);

  await generateVoiceWithGradio({ text, outputPath: audioFile, refAudioPath });

  // Bước 1: Đảm bảo ảnh đầu vào có width/height chẵn
  const paddedImageFile = audioFile.replace(/\.wav$/, "_even.jpg");
  await new Promise((resolve, reject) => {
    const ffmpegPad = spawn("ffmpeg", [
      "-y",
      "-i", imageUrl,
      "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
      paddedImageFile
    ]);
    ffmpegPad.on("close", code => (code === 0 ? resolve(null) : reject(new Error("ffmpeg pad failed"))));
  });

  // Bước 2: Ghép ảnh đã chuẩn hóa và audio thành video
  const videoFile = audioFile.replace(/\.wav$/, ".mp4");
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-loop", "1",
      "-i", paddedImageFile,
      "-i", audioFile,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-pix_fmt", "yuv420p",
      videoFile
    ]);
    ffmpeg.on("close", code => (code === 0 ? resolve(null) : reject(new Error("ffmpeg failed"))));
  });

  // Trả về URL video
  const url = `/temp-videos/${videoFile.split("temp-videos\\").pop()}`;
  return new Response(JSON.stringify({ url }), { status: 200 });
}
