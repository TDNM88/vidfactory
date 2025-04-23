import { NextResponse } from "next/server";
import { join } from "path";
import { spawn } from "child_process";
import { existsSync } from "fs";
import ffmpegStatic from "ffmpeg-static";

// Ưu tiên lấy ffmpeg từ ffmpeg-bin nếu có
let ffmpegPath = join(process.cwd(), "ffmpeg-bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
if (!existsSync(ffmpegPath)) {
  ffmpegPath = ffmpegStatic as string;
}

export async function POST(request: Request) {
  try {
    const { videoFiles, musicFile } = await request.json();
    if (!Array.isArray(videoFiles) || videoFiles.length === 0 || !musicFile) {
      return NextResponse.json({ success: false, error: "Thiếu danh sách video hoặc nhạc nền" });
    }

    // Đường dẫn tuyệt đối
    const videoPaths = videoFiles.map((v: string) => join(process.cwd(), "public", v.replace(/^\//, "")));
    const musicPath = join(process.cwd(), "public", musicFile.replace(/^\//, ""));
    const listPath = join(process.cwd(), "public", "generated", `concat-list-${Date.now()}.txt`);
    const outputName = `final-video-${Date.now()}.mp4`;
    const outputPath = join(process.cwd(), "public", "generated", outputName);
    const outputUrl = `/generated/${outputName}`;

    // Tạo file danh sách video cho ffmpeg
    const listContent = videoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
    require("fs").writeFileSync(listPath, listContent, "utf8");

    // Lệnh ffmpeg: nối video, chèn nhạc nền với âm lượng 20%
    const ffmpegArgs = [
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-i", musicPath,
      "-filter_complex", "[1:a]volume=0.2[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=3[aout]",
      "-map", "0:v", "-map", "[aout]",
      "-c:v", "libx264", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
      outputPath
    ];

    console.log("[API] Ghép video:", ffmpegPath, ffmpegArgs);

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath as string, ffmpegArgs, { stdio: "inherit" });
      ffmpeg.on("error", (err) => {
        console.error("[API] Lỗi khi chạy ffmpeg (concat):", err);
        reject(err);
      });
      ffmpeg.on("close", (code) => {
        require("fs").unlinkSync(listPath);
        if (code === 0) resolve(true);
        else reject(new Error("ffmpeg exited with code " + code));
      });
    });

    return NextResponse.json({ success: true, videoUrl: outputUrl });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Lỗi khi ghép video" });
  }
}
