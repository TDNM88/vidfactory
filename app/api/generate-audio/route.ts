import { NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const { script } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < script.segments.length; i++) {
          const segment = script.segments[i];
          const text = segment.script;

          if (!text) {
            controller.enqueue(
              JSON.stringify({
                type: "error",
                index: i,
                message: "Không có nội dung để tạo giọng nói",
              }) + "\n"
            );
            continue; // Continue to the next segment if no text
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

          // Gọi Edge TTS CLI
          try {
            const command = `pnpm dlx edge-tts --voice vi-VN-HoaiMyNeural --text "${text}" --write-media "${filePath}"`;
            await execAsync(command);

            // Kiểm tra file đã được tạo chưa
            await fs.access(filePath);
            // File exists, proceed to enqueue the success message
            controller.enqueue(
              JSON.stringify({
                type: "voice",
                index: i,
                voice_path: filePath,
                direct_voice_url: audioUrl,
              }) + "\n"
            );
          } catch (err: any) {
            console.error("Error generating voice with Edge TTS CLI:", err);
            controller.enqueue(
              JSON.stringify({
                type: "error",
                index: i,
                message: "Lỗi khi tạo giọng nói: " + err.message,
              }) + "\n"
            );
            controller.close();
            return; // Stop the loop in case of error
          }

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