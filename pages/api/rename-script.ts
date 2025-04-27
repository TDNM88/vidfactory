import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

// API đổi tên kịch bản (chỉ đổi subject và summary trong file, không đổi tên file vật lý)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const { session_id, file, subject, summary } = req.body;
    const saveDir = path.join(process.cwd(), 'tmp', 'saved-scripts');
    let filePath = '';
    if (file) {
      filePath = path.join(saveDir, String(file));
    } else if (session_id) {
      filePath = path.join(saveDir, `${session_id}.json`);
    } else {
      return res.status(400).json({ success: false, error: 'Thiếu session_id hoặc file!' });
    }
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    data.subject = subject;
    data.summary = summary;
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
