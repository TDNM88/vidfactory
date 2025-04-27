import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

// API trả về danh sách file kịch bản đã lưu (chỉ tên file và thông tin cơ bản)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const saveDir = path.join(process.cwd(), 'tmp', 'saved-scripts');
    await fs.mkdir(saveDir, { recursive: true });
    const files = await fs.readdir(saveDir);
    const scripts = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(saveDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      try {
        const data = JSON.parse(content);
        scripts.push({
          session_id: data.session_id,
          subject: data.subject,
          summary: data.summary,
          savedAt: data.savedAt,
          file: file
        });
      } catch {}
    }
    scripts.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    return res.status(200).json({ success: true, scripts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
