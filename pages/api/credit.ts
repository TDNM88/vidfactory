import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyToken(req, prisma);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (req.method === 'POST') {
    // Trừ credit khi thao tác AI
    const { delta, action, note } = req.body;
    if (!delta || typeof delta !== 'number') return res.status(400).json({ success: false, error: 'Missing or invalid delta' });
    if (user.credit + delta < 0) return res.status(400).json({ success: false, error: 'Không đủ credit' });
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { credit: { increment: delta } } }),
      prisma.creditLog.create({ data: { userId: user.id, action, delta, note } })
    ]);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
