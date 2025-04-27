import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyToken(req, prisma);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (req.method === 'GET') {
    // Super admin: xem mọi log, user thường: chỉ xem của mình
    const where = user.isAdmin ? {} : { userId: user.id };
    const logs = await prisma.creditLog.findMany({ where, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true, brandName: true } } } });
    return res.status(200).json({ success: true, logs });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
