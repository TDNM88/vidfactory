// lib/vidu-api.ts
import fetch from "node-fetch";
import sharp from "sharp";

const VIDU_API_URL = "https://api.vidu.com/ent/v2";
const VIDU_API_KEY = process.env.VIDU_API_KEY;

export interface ViduImg2VideoParams {
  model: "vidu2.0" | "vidu1.5" | "vidu1.0";
  images: string[]; // Only 1 image allowed, URL or base64
  prompt?: string;
  duration?: number; // 4 or 8
  seed?: number;
  resolution?: "360p" | "720p" | "1080p";
  movement_amplitude?: "auto" | "small" | "medium" | "large";
  callback_url?: string;
}

export interface ViduImg2VideoResponse {
  task_id: string;
  state: string;
  model: string;
  images: string[];
  prompt: string;
  duration: number;
  seed: number;
  resolution: string;
  movement_amplitude: string;
  created_at: string;
  error?: string;
}

// Hàm tạo video từ ảnh
export async function viduImg2Video(params: ViduImg2VideoParams): Promise<ViduImg2VideoResponse> {
  if (!VIDU_API_KEY) {
    return {
      task_id: "",
      state: "",
      model: "",
      images: [],
      prompt: "",
      duration: 0,
      seed: 0,
      resolution: "",
      movement_amplitude: "",
      created_at: "",
      error: "Lỗi: Chưa cấu hình VIDU_API_KEY",
    };
  }
  if (!params.model || !params.images || params.images.length !== 1) {
    return {
      task_id: "",
      state: "",
      model: "",
      images: [],
      prompt: "",
      duration: 0,
      seed: 0,
      resolution: "",
      movement_amplitude: "",
      created_at: "",
      error: "Lỗi: Cần 1 ảnh và model",
    };
  }

  const url = `${VIDU_API_URL}/img2video`;
  const headers = {
    Authorization: `Token ${VIDU_API_KEY}`,
    "Content-Type": "application/json",
  };
  const payload: Record<string, any> = {
    ...params,
    duration: params.duration ?? 4,
    resolution: params.resolution ?? "360p",
    movement_amplitude: params.movement_amplitude ?? "auto",
  };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as Partial<ViduImg2VideoResponse> & { [key: string]: any };
    if (!response.ok || typeof result?.task_id !== "string") {
      return {
        task_id: result?.task_id ?? "",
        state: result?.state ?? "",
        model: result?.model ?? "",
        images: Array.isArray(result?.images) ? result.images : [],
        prompt: typeof result?.prompt === "string" ? result.prompt : "",
        duration: typeof result?.duration === "number" ? result.duration : 0,
        seed: typeof result?.seed === "number" ? result.seed : 0,
        resolution: typeof result?.resolution === "string" ? result.resolution : "",
        movement_amplitude: typeof result?.movement_amplitude === "string" ? result.movement_amplitude : "",
        created_at: typeof result?.created_at === "string" ? result.created_at : "",
        error: typeof result?.message === "string" ? result.message : result?.error ?? "Lỗi: Không nhận được ID tác vụ.",
      };
    }
    return {
      task_id: typeof result.task_id === "string" ? result.task_id : "",
      state: typeof result.state === "string" ? result.state : "",
      model: typeof result.model === "string" ? result.model : "",
      images: Array.isArray(result.images) ? result.images : [],
      prompt: typeof result.prompt === "string" ? result.prompt : "",
      duration: typeof result.duration === "number" ? result.duration : 0,
      seed: typeof result.seed === "number" ? result.seed : 0,
      resolution: typeof result.resolution === "string" ? result.resolution : "",
      movement_amplitude: typeof result.movement_amplitude === "string" ? result.movement_amplitude : "",
      created_at: typeof result.created_at === "string" ? result.created_at : "",
      error: undefined,
    };
  } catch (e: any) {
    return {
      task_id: "",
      state: "",
      model: "",
      images: [],
      prompt: "",
      duration: 0,
      seed: 0,
      resolution: "",
      movement_amplitude: "",
      created_at: "",
      error: `Lỗi: ${e.message}`,
    };
  }
}

// Hàm tạo session upload ảnh
export async function createViduUploadSession(filename: string, fileSize: number, contentType: string) {
  const res = await fetch(`${VIDU_API_URL}/files/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Token ${VIDU_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_name: filename,
      file_size: fileSize,
      content_type: contentType,
    }),
  });
  if (!res.ok) throw new Error("Không tạo được session upload VIDU");
  return await res.json(); // { id, put_url, uri }
}

// Hàm upload file lên put_url
export async function uploadFileToViduPutUrl(putUrl: string, buffer: Buffer, contentType: string) {
  const res = await fetch(putUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: buffer,
  });
  if (![200, 201, 203].includes(res.status)) throw new Error("Lỗi upload file lên VIDU");
}

// Hàm resize ảnh theo kích thước nền tảng
export async function processImageToPlatformSize(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, height, { fit: "cover" })
    .png()
    .toBuffer();
}