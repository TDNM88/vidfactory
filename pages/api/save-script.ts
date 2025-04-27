import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

// Lưu kịch bản vào thư mục tạm trên server (có thể thay bằng DB hoặc cloud storage nếu muốn)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { session_id, script, subject, summary, platform, duration, styleSettings } = req.body;
    if (!session_id || !script) {
      return res.status(400).json({ success: false, error: 'Thiếu session_id hoặc script!' });
    }
    const saveDir = path.join(process.cwd(), 'tmp', 'saved-scripts');
    await fs.mkdir(saveDir, { recursive: true });
    const filePath = path.join(saveDir, `${session_id}.json`);
    const data = {
      session_id,
      script,
      subject,
      summary,
      platform,
      duration,
      styleSettings,
      savedAt: new Date().toISOString(),
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return res.status(200).json({ success: true, filePath });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
