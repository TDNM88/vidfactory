// pages/api/concat-videos-with-music.ts
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

const execFilePromise = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoFiles, musicFile, musicVolume = 0.2, platform = "TikTok" } = body;

    if (!videoFiles || !Array.isArray(videoFiles) || videoFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Danh sách video không hợp lệ" },
        { status: 400 }
      );
    }

    // Kiểm tra ffmpeg
    const ffmpegPath = join(process.cwd(), "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    if (!existsSync(ffmpegPath)) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy ffmpeg binary tại ${ffmpegPath}` },
        { status: 500 }
      );
    }

    // Tạo thư mục lưu video
    const tempDir = join(process.cwd(), "public", "temp-videos");
    await fs.mkdir(tempDir, { recursive: true });

    // Tạo file danh sách video
    const listFile = join(tempDir, `list-${Date.now()}.txt`);
    const videoPaths = videoFiles.map((file: string) => join(process.cwd(), "public", file));
    await fs.writeFile(listFile, videoPaths.map((path) => `file '${path}'`).join("\n"));

    // Ghép các video
    const outputVideo = join(tempDir, `concat-${Date.now()}.mp4`);
    await execFilePromise(ffmpegPath, [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listFile,
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      outputVideo,
    ]);

    // Thêm nhạc nền nếu có
    let finalVideo = outputVideo;
    const videoUrl = `/temp-videos/${outputVideo.split(/[\\/]/).pop()}`;
    if (musicFile && musicFile !== "none") {
      const musicPath = join(process.cwd(), "public", musicFile);
      if (existsSync(musicPath)) {
        const withMusic = join(tempDir, `final-${Date.now()}.mp4`);
        await execFilePromise(ffmpegPath, [
          "-y",
          "-i",
          outputVideo,
          "-i",
          musicPath,
          "-filter_complex",
          `[0:a]volume=1[a];[1:a]volume=${musicVolume}[b];[a][b]amix=inputs=2:duration=first`,
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-shortest",
          withMusic,
        ]);
        finalVideo = withMusic;
        videoUrl = `/temp-videos/${withMusic.split(/[\\/]/).pop()}`;
      }
    }

    // Xóa file danh sách
    await fs.unlink(listFile);

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Error concatenating videos:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi ghép video" },
      { status: 500 }
    );
  }
}