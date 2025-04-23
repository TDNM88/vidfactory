import fetch from 'node-fetch';
import sharp from 'sharp';

const VIDU_API_URL = 'https://api.vidu.com/ent/v2';
const VIDU_API_KEY = process.env.VIDU_API_KEY;

// 1. Tạo session upload ảnh lên VIDU
export async function createViduUploadSession(filename: string, fileSize: number, contentType: string) {
  const res = await fetch(`${VIDU_API_URL}/files/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${VIDU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_name: filename,
      file_size: fileSize,
      content_type: contentType,
    }),
  });
  if (!res.ok) throw new Error('Không tạo được session upload VIDU');
  return await res.json(); // { id, put_url, uri }
}

// 2. Upload file thực tế lên put_url
export async function uploadFileToViduPutUrl(putUrl: string, buffer: Buffer, contentType: string) {
  const res = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: buffer,
  });
  if (![200, 201, 203].includes(res.status)) throw new Error('Lỗi upload file lên VIDU');
}

// 3. Resize ảnh đúng size nền tảng (width, height) và convert sang PNG buffer
export async function processImageToPlatformSize(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, height, { fit: 'cover' })
    .png()
    .toBuffer();
}
