import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: { bodyParser: false }
};

async function downloadImageToFile(url: string, savePath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không tải được ảnh từ URL');
  const arrayBuffer = await res.arrayBuffer();
  await fs.promises.writeFile(savePath, Buffer.from(arrayBuffer));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const form = formidable({ multiples: false });
    let responded = false;
    form.parse(req, async (err, fields, files) => {
      try {
        if (responded) return;
        if (err) {
          responded = true;
          return res.status(500).json({ error: 'Lỗi khi upload ảnh' });
        }
        // Nếu có image_url thì tải về
        const imageUrl = fields.image_url as string | undefined;
        if (imageUrl) {
          try {
            const ext = path.extname(imageUrl.split('?')[0] || '.png').toLowerCase() || '.png';
            const fileName = `img_${Date.now()}${ext}`;
            const savePath = path.join(process.cwd(), 'public', 'generated-images', fileName);
            await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
            await downloadImageToFile(imageUrl, savePath);
            responded = true;
            return res.status(200).json({ url: `/generated-images/${fileName}` });
          } catch (e: any) {
            responded = true;
            return res.status(500).json({ error: e.message || 'Lỗi khi tải ảnh từ URL' });
          }
        }
        // Nếu có file upload thì xử lý như cũ
        const file = files.image;
        if (!file || Array.isArray(file)) {
          responded = true;
          return res.status(400).json({ error: 'Không có file ảnh' });
        }
        const realFile = file as formidable.File;
        const ext = path.extname(realFile.originalFilename || '').toLowerCase();
        const fileName = `img_${Date.now()}${ext}`;
        const savePath = path.join(process.cwd(), 'public', 'generated-images', fileName);
        await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
        await fs.promises.copyFile(realFile.filepath, savePath);
        responded = true;
        return res.status(200).json({ url: `/generated-images/${fileName}` });
      } catch (err: any) {
        if (!responded) {
          responded = true;
          return res.status(500).json({ error: err.message || 'Lỗi server không xác định' });
        }
      }
    });
    // Fallback: Nếu callback không trả response sau 30s thì trả lỗi
    setTimeout(() => {
      if (!responded) {
        responded = true;
        res.status(500).json({ error: 'Timeout khi xử lý upload ảnh' });
      }
    }, 30000);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Lỗi server ngoài callback' });
  }
} 