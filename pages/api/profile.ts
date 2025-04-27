import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyToken(req, prisma);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        credit: user.credit,
        brandName: user.brandName,
        logoUrl: user.logoUrl,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
