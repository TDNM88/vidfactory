// API Img2Video TDNM (TypeScript, Next.js API helper)
import fetch from 'node-fetch';

const VIDU_API_URL = process.env.VIDU_API_URL;
const VIDU_API_KEY = process.env.VIDU_API_KEY;
const DEFAULT_MODEL = process.env.VIDU_DEFAULT_MODEL || 'vidu-v2-1';

export async function imgToVideo({
  image,
  prompt,
  resolution = '720p',
  duration = 4,
  movement_amplitude = 'auto',
  seed,
  user_key,
}: {
  image: string; // local path or base64 or url
  prompt?: string;
  resolution?: string;
  duration?: number;
  movement_amplitude?: string;
  seed?: number;
  user_key?: string;
}): Promise<{ task_id?: string; error?: string; message?: string }> {
  // Validate API key
  if (!VIDU_API_KEY) {
    return { error: 'Lỗi: Khóa API TDNM chưa được cấu hình.' };
  }
  if (!image) {
    return { error: 'Lỗi: Cần cung cấp một hình ảnh.' };
  }
  if (prompt && prompt.length > 1500) {
    return { error: 'Lỗi: Mô tả văn bản không được vượt quá 1500 ký tự.' };
  }
  // TODO: Optionally validate user_key if needed

  // TODO: Implement upload_image_to_vidu if needed (for now assume image is already a URL)
  const image_uri = image;

  const url = `${VIDU_API_URL}/ent/v2/img2video`;
  const headers = {
    'Authorization': `Token ${VIDU_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const payload: Record<string, any> = {
    model: DEFAULT_MODEL,
    images: [image_uri],
    prompt: prompt || '',
    duration,
    resolution,
    movement_amplitude,
  };
  if (seed !== undefined) payload.seed = seed;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    const task_id: string | undefined = typeof result?.task_id === "string" ? result.task_id : undefined;
    const message: string | undefined = typeof result?.message === "string" ? result.message : undefined;
    if (!response.ok || !task_id) {
      return { error: message || 'Lỗi: Không nhận được ID tác vụ.', task_id, message };
    }
    return { task_id, message: message || `Tác vụ được tạo thành công. ID tác vụ: ${task_id}` };
  } catch (e: any) {
    return { error: `Lỗi: ${e.message}`, task_id: undefined, message: undefined };
  }
}
