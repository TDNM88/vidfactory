import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

// API xoá file kịch bản theo session_id hoặc file
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const { session_id, file } = req.query;
    const saveDir = path.join(process.cwd(), 'tmp', 'saved-scripts');
    let filePath = '';
    if (file) {
      filePath = path.join(saveDir, String(file));
    } else if (session_id) {
      filePath = path.join(saveDir, `${session_id}.json`);
    } else {
      return res.status(400).json({ success: false, error: 'Thiếu session_id hoặc file!' });
    }
    await fs.unlink(filePath);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
