import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

// Thông tin chi phí API mặc định
const defaultApiCosts = {
  'generate-script': { creditCost: 1, displayName: 'Tạo kịch bản' },
  'generate-image': { creditCost: 2, displayName: 'Tạo hình ảnh' },
  'generate-voice': { creditCost: 3, displayName: 'Tạo giọng nói' },
  'analyze-content': { creditCost: 5, displayName: 'Phân tích nội dung' },
  'merge-video-voice': { creditCost: 10, displayName: 'Ghép video và giọng nói' },
  'concat-videos': { creditCost: 15, displayName: 'Ghép nhiều video' },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Lấy tên API từ query parameters
    const { apiName } = req.query;
    
    if (!apiName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu tham số apiName' 
      });
    }

    // Xác thực người dùng (không bắt buộc)
    const user = await verifyToken(req, prisma);
    
    // Kiểm tra xem API có trong danh sách mặc định không
    const apiNameStr = apiName as string;
    const defaultCost = defaultApiCosts[apiNameStr as keyof typeof defaultApiCosts];
    
    // Nếu người dùng chưa xác thực, trả về chi phí mặc định
    if (!user) {
      if (defaultCost) {
        return res.status(200).json({
          success: true,
          apiName: apiNameStr,
          creditCost: defaultCost.creditCost,
          displayName: defaultCost.displayName,
          canAfford: false,
          userCredit: 0,
          isBasicFree: false
        });
      } else {
        // Nếu không tìm thấy API trong danh sách mặc định
        return res.status(200).json({
          success: true,
          apiName: apiNameStr,
          creditCost: 1,
          displayName: apiNameStr,
          canAfford: false,
          userCredit: 0,
          isBasicFree: false
        });
      }
    }

    // Lấy thông tin giá của API
    const pricing = await prisma.apiPricing.findUnique({
      where: { apiName: apiNameStr },
    });

    if (!pricing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Không tìm thấy thông tin giá cho API này' 
      });
    }

    // Kiểm tra xem người dùng có đủ credit không
    const canAfford = user.credit >= pricing.creditCost;
    
    // Kiểm tra xem API này có miễn phí cho gói Basic không
    // Mặc định tất cả người dùng đều dùng gói Basic nếu không có trường plan trong model
    const isBasicFree = pricing.isFreeForBasic;

    return res.status(200).json({
      success: true,
      apiName: pricing.apiName,
      creditCost: isBasicFree ? 0 : pricing.creditCost,
      displayName: pricing.displayName,
      canAfford,
      userCredit: user.credit,
      isBasicFree
    });
  } catch (error: any) {
    console.error('Error fetching API cost:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
