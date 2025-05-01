import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';

const VIDU_API_KEY = process.env.VIDU_API_KEY;
const VIDU_API_URL = 'https://api.vidu.com';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!VIDU_API_KEY) {
    return res.status(500).json({ error: 'VIDU_API_KEY not configured' });
  }
  try {
    const { files } = await parseForm(req);
    const file = files.image;
    if (!file) return res.status(400).json({ error: 'No image uploaded' });
    const imgFile = Array.isArray(file) ? file[0] : file;
    if (!imgFile.filepath) return res.status(400).json({ error: 'Invalid file' });
    // Kiểm tra size < 10MB
    const stat = await promisify(fs.stat)(imgFile.filepath);
    if (stat.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large (max 10MB)' });
    }
    // Kiểm tra định dạng
    const ext = path.extname(imgFile.originalFilename || '').toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported image format' });
    }
    // Kiểm tra tỉ lệ khung hình
    const image = sharp(imgFile.filepath);
    const meta = await image.metadata();
    if (!meta.width || !meta.height) {
      return res.status(400).json({ error: 'Cannot read image size' });
    }
    const aspect = meta.width / meta.height;
    if (aspect < 0.25 || aspect > 4) {
      return res.status(400).json({ error: 'Aspect ratio must be between 1:4 and 4:1' });
    }
    // Đọc binary
    const buffer = await promisify(fs.readFile)(imgFile.filepath);
    // Bước 1: tạo upload session
    const sessionRes = await fetch(`${VIDU_API_URL}/tools/v2/files/uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${VIDU_API_KEY}`,
      },
      body: JSON.stringify({ scene: 'vidu' }),
    });
    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      return res.status(500).json({ error: 'Create upload session failed: ' + err });
    }
    const { id, put_url } = await sessionRes.json();
    if (!id || !put_url) return res.status(500).json({ error: 'No id or put_url from Vidu' });
    // Bước 2: upload ảnh lên put_url
    const putRes = await fetch(put_url, {
      method: 'PUT',
      headers: { 'Content-Type': meta.format === 'jpeg' ? 'image/jpeg' : meta.format === 'png' ? 'image/png' : meta.format === 'webp' ? 'image/webp' : 'application/octet-stream' },
      body: buffer,
    });
    if (!putRes.ok) {
      const err = await putRes.text();
      return res.status(500).json({ error: 'Upload image failed: ' + err });
    }
    const etag = putRes.headers.get('etag')?.replace(/"/g, '');
    if (!etag) return res.status(500).json({ error: 'No etag from upload' });
    // Bước 3: finish upload
    const finishRes = await fetch(`${VIDU_API_URL}/tools/v2/files/uploads/${id}/finish`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${VIDU_API_KEY}`,
      },
      body: JSON.stringify({ etag }),
    });
    if (!finishRes.ok) {
      const err = await finishRes.text();
      return res.status(500).json({ error: 'Finish upload failed: ' + err });
    }
    const { uri } = await finishRes.json();
    if (!uri) return res.status(500).json({ error: 'No uri from finish upload' });
    return res.status(200).json({ uri });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
} 