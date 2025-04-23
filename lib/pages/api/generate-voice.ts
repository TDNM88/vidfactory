// pages/api/generate-voice.ts
import { NextResponse } from "next/server";
import { generateVoiceWithGradio } from "@/lib/gradio-tts";
import { phonemizeVietnamese } from "@/lib/phonemize-vi";
import { join } from "path";
import { promises as fs } from "fs";

export async function POST(request: Request) {
  try {
    const { text, segmentIdx, voiceName } = await request.json();

    if (!text || isNaN(segmentIdx)) {
      return NextResponse.json(
        { success: false, error: "Thiếu văn bản hoặc chỉ số phân đoạn không hợp lệ" },
        { status: 400 }
      );
    }

    // Phiên âm văn bản
    const phonemizedText = phonemizeVietnamese(text);
    console.log("Original text:", text);
    console.log("Phonemized text:", phonemizedText);

    const fileName = `voice-${Date.now()}-${segmentIdx}.mp3`;
    const outputPath = join(process.cwd(), "public", "generated", fileName);
    const voiceUrl = `/generated/${fileName}`;

    // Đảm bảo thư mục public/generated tồn tại
    await fs.mkdir(join(process.cwd(), "public", "generated"), { recursive: true });

    // Xác định đường dẫn file mẫu giọng
    const voicesDir = join(process.cwd(), "public", "voices");
    const refAudioPath = voiceName ? join(voicesDir, voiceName) : null;

    // Kiểm tra file mẫu giọng (nếu có)
    if (refAudioPath && !(await fs.access(refAudioPath).then(() => true).catch(() => false))) {
      return NextResponse.json(
        { success: false, error: `File giọng mẫu ${voiceName} không tồn tại` },
        { status: 400 }
      );
    }

    // Gọi Gradio TTS
    await generateVoiceWithGradio({
      text: phonemizedText,
      outputPath,
      refAudioPath,
      speed: 1,
    });

    return NextResponse.json({
      success: true,
      voiceUrl,
    });
  } catch (error: any) {
    console.error("Error generating voice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi tạo giọng đọc" },
      { status: 500 }
    );
  }
}