import { Client, FileData } from "@gradio/client";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import fetch from "node-fetch";

// Hàm gọi Gradio TTS và lưu file mp3 trả về
export async function generateVoiceWithGradio({
  text,
  outputPath,
  refAudioPath = null,
  speed = 1
}: {
  text: string,
  outputPath: string,
  refAudioPath?: string | null,
  speed?: number
}) {
  // Đọc HuggingFace token từ biến môi trường
  const hfTokenRaw = process.env.HF_TOKEN;
  const hfToken = hfTokenRaw && hfTokenRaw.startsWith("hf_") ? (hfTokenRaw as `hf_${string}`) : undefined;
  // Kết nối tới Space, truyền token nếu có
  const client = await Client.connect("hynt/F5-TTS-Vietnamese-100h", { hf_token: hfToken });

  // Chuẩn bị file mẫu giọng (nếu có)
  let ref_audio_blob: Blob;
  if (refAudioPath) {
    ref_audio_blob = new Blob([fs.readFileSync(refAudioPath)]);
  } else {
    // Nếu không có file mẫu, tạo blob rỗng
    ref_audio_blob = new Blob([]);
  }

  // Gọi API
  const result: any = await client.predict("/infer_tts", {
    ref_audio_orig: ref_audio_blob,
    gen_text: text,
    speed: speed,
  });

  // Xử lý kết quả trả về
  let audioUrl: string | undefined = undefined;
  if (result && result.data && result.data[0]) {
    if (typeof result.data[0] === "string") {
      audioUrl = result.data[0];
    } else if (typeof result.data[0] === "object" && "url" in result.data[0]) {
      audioUrl = result.data[0].url;
    }
  }

  if (audioUrl) {
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
  } else {
    throw new Error("Không nhận được file audio từ API Gradio");
  }
}
