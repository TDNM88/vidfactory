import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import type { AuthOptions } from "next-auth";

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function verifyToken(req: NextApiRequest, prisma: PrismaClient) {
  const header = req.headers.authorization;
  if (!header) return null;
  const token = header.replace(/^Bearer /, '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number, isAdmin: boolean };
    const user = await prisma.user.findUnique({ 
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        password: true,
        credit: true,
        totalSpentCredits: true,
        brandName: true,
        logoUrl: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return user;
  } catch {
    return null;
  }
}

export async function verifyAdmin(req: NextApiRequest, prisma: PrismaClient) {
  const user = await verifyToken(req, prisma);
  if (!user || !user.isAdmin) return null;
  return user;
}

export const authOptions: AuthOptions = {
  providers: [
    // ... cấu hình providers ...
  ],
  callbacks: {
    redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin', // Trang đăng nhập
    signOut: '/auth/signout', // Trang đăng xuất
    error: '/auth/error', // Trang lỗi
    newUser: '/onboarding' // Trang cho user mới
  }
};
