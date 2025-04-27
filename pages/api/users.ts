import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

import { verifyAdmin } from '../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only super admin can access
  const admin = await verifyAdmin(req, prisma);
  if (!admin) return res.status(403).json({ success: false, error: 'Forbidden' });

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({ where: { isAdmin: false }, select: { id: true, username: true, credit: true, brandName: true, logoUrl: true, email: true, createdAt: true, updatedAt: true } });
    return res.status(200).json({ success: true, users });
  }
  if (req.method === 'POST') {
    const { username, password, brandName, logoUrl, email, credit } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Missing username or password' });
    const user = await prisma.user.create({ data: { username, password, brandName, logoUrl, email, credit: credit || 0 } });
    return res.status(201).json({ success: true, user });
  }
  if (req.method === 'PUT') {
    const { id, credit, password, brandName, logoUrl, email } = req.body;
    const data: any = { credit, brandName, logoUrl, email };
    if (password) data.password = password;
    const user = await prisma.user.update({ where: { id }, data });
    return res.status(200).json({ success: true, user });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
