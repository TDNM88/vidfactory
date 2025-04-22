import { NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import { join } from "path";
import { generateVoiceWithGradio } from "./gradio-tts-util";
import { phonemizeVietnamese } from "../../../lib/phonemizeVietnamese";

export async function POST(request: Request) {
  const { script, originalIndex } = await request.json(); // originalIndex lấy từ request body

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < script.segments.length; i++) {
          const segment = script.segments[i];
          let text = segment.script;
// Chuyển sang phiên âm tiếng Việt (bao gồm số, ký hiệu, latin)
text = phonemizeVietnamese(text);

          if (!text) {
            controller.enqueue(
              JSON.stringify({
                type: "error",
                index: i,
                message: "Không có nội dung để tạo giọng nói",
              }) + "\n"
            );
            continue;
          }

          controller.enqueue(
            JSON.stringify({
              type: "progress",
              index: i,
              message: `Đang tạo giọng nói cho phân đoạn ${i + 1}...`,
            }) + "\n"
          );

          const fileName = `voice-${Date.now()}-${i}.mp3`;
          const filePath = join(process.cwd(), "public", "generated", fileName);
          const audioUrl = `/generated/${fileName}`;

          // Xác định file giọng mẫu nếu có
          const refAudioPath = segment.voice_sample_path
            ? join(process.cwd(), "public", segment.voice_sample_path.replace(/^\//, ""))
            : null;

          // Gọi Gradio API để tạo file mp3 với giọng mẫu
          await generateVoiceWithGradio({ text, outputPath: filePath, refAudioPath });

          // Kiểm tra file đã được tạo chưa
          await fs.access(filePath).catch(async () => {
            throw new Error(`Không thể tạo file âm thanh cho phân đoạn ${i + 1}`);
          });

          console.log("DEBUG originalIndex:", originalIndex, "index:", i);
          controller.enqueue(
            JSON.stringify({
              type: "voice",
              index: i,
              originalIndex: originalIndex, // luôn trả về originalIndex truyền lên
              voice_path: filePath,
              direct_voice_url: audioUrl,
            }) + "\n"
          );
        }

        controller.enqueue(JSON.stringify({ type: "complete" }) + "\n");
        controller.close();
      } catch (error) {
        console.error("Error generating voice with Edge TTS CLI:", error);
        controller.enqueue(
          JSON.stringify({
            type: "error",
            message: "Lỗi khi tạo giọng nói: " + (error as Error).message,
          }) + "\n"
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text-event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}