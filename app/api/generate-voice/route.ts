import { NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import { join } from "path";
import { generateVoiceWithGradio } from "./gradio-tts-util";
import { phonemizeVietnamese } from "../../../lib/phonemizeVietnamese";

export async function POST(request: Request) {
  const { text, voiceSamplePath } = await request.json();
  try {
    // Chuyển sang phiên âm tiếng Việt nếu cần
    const phonemizedText = phonemizeVietnamese(text);

    // Tạo file mp3
    const fileName = `voice-${Date.now()}.mp3`;
    const filePath = join(process.cwd(), "public", "generated", fileName);
    const audioUrl = `/generated/${fileName}`;

    const refAudioPath = voiceSamplePath
      ? join(process.cwd(), "public", voiceSamplePath.replace(/^\//, ""))
      : null;

    await generateVoiceWithGradio({ text: phonemizedText, outputPath: filePath, refAudioPath });

    await fs.access(filePath).catch(() => {
      throw new Error("Không thể tạo file âm thanh!");
    });

    return NextResponse.json({ success: true, audioUrl });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}