import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

import { verifyAdmin } from '../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only super admin can reset password
  const admin = await verifyAdmin(req, prisma);
  if (!admin) return res.status(403).json({ success: false, error: 'Forbidden' });

  if (req.method === 'POST') {
    const { id, password } = req.body;
    if (!id || !password) return res.status(400).json({ success: false, error: 'Missing id or password' });
    await prisma.user.update({ where: { id }, data: { password } });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
