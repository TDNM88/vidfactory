import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';
import CreditService from '../../../services/CreditService';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

// Dữ liệu gói credit mặc định cho người dùng chưa đăng nhập
const defaultCreditPackages = [
  { id: 1, name: 'Gói Nhỏ', credits: 100, price: 50000, description: 'Gói 100 credits cơ bản' },
  { id: 2, name: 'Gói Vừa', credits: 500, price: 200000, description: 'Gói 500 credits tiết kiệm 20%' },
  { id: 3, name: 'Gói Lớn', credits: 1200, price: 400000, description: 'Gói 1200 credits tiết kiệm 30%' }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Xác thực người dùng (không bắt buộc)
    const user = await verifyToken(req, prisma);
    
    // Nếu người dùng chưa đăng nhập, trả về dữ liệu mặc định
    if (!user) {
      return res.status(200).json({
        success: true,
        packages: defaultCreditPackages,
        pricing: {
          generateScript: 1,
          generateImage: 2,
          generateVoice: 3,
          analyzeContent: 5,
          mergeVideo: 10
        }
      });
    }

    // Lấy thông tin giá của các API
    const pricingResult = await creditService.getApiPricing();
    
    if (!pricingResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: pricingResult.error 
      });
    }

    // Lấy thông tin về các gói tín dụng
    const packagesResult = await creditService.getCreditPackages();
    
    if (!packagesResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: packagesResult.error 
      });
    }

    return res.status(200).json({
      success: true,
      packages: packagesResult.packages,
      pricing: pricingResult.pricing
    });
  } catch (error: any) {
    console.error('Error fetching credit pricing:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
