import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';
import CreditService from '../../services/CreditService';
import { createClient } from 'pexels';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

// Kích thước video theo nền tảng
const PLATFORM_DIMENSIONS = {
  'tiktok': { width: 1080, height: 1920 }, // 9:16
  'instagram': { width: 1080, height: 1350 }, // 4:5
  'youtube': { width: 1920, height: 1080 }, // 16:9
  'facebook': { width: 1200, height: 630 }, // 1.91:1
  'default': { width: 1080, height: 1080 } // 1:1 (mặc định)
};

// Hàm trích xuất từ khóa quan trọng nhất từ mô tả ảnh
function extractMainKeyword(imageDescription: string): string {
  // Loại bỏ các từ dừng tiếng Việt phổ biến
  const stopWords = [
    'và', 'hoặc', 'nhưng', 'vì', 'nên', 'do', 'của', 'với', 'trong', 'ngoài', 
    'trên', 'dưới', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười',
    'là', 'có', 'không', 'được', 'bị', 'đang', 'sẽ', 'đã', 'rất', 'thì', 'mà', 'để',
    'này', 'kia', 'ấy', 'thế', 'vậy', 'những', 'các', 'cái', 'chiếc', 'người', 'thời gian',
    'the', 'a', 'an', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'
  ];
  
  // Tách mô tả thành các từ
  const words = imageDescription
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/);
  
  // Lọc bỏ các từ dừng và sắp xếp theo độ dài (ưu tiên từ dài hơn vì thường là danh từ quan trọng)
  const filteredWords = words
    .filter(word => !stopWords.includes(word) && word.length > 2)
    .sort((a, b) => b.length - a.length);
  
  // Trả về từ khóa đầu tiên sau khi lọc, hoặc một từ khóa mặc định nếu không tìm thấy
  return filteredWords.length > 0 ? filteredWords[0] : 'nature';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Xác thực người dùng
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Parse body
    const { imageDescription, platform, segmentIdx } = req.body;
    
    if (!imageDescription) {
      return res.status(400).json({ success: false, error: "Missing image description" });
    }

    // Kiểm tra và trừ credit
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    const creditResult = await creditService.deductCredit(
      userId,
      'generate-image', // Đã thêm API này vào database
      'Tìm ảnh từ Pexels',
      { username: user.username }
    );

    if (!creditResult.success) {
      return res.status(400).json({ success: false, error: creditResult.error });
    }

    // Lấy API key của Pexels
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    if (!pexelsApiKey) {
      return res.status(500).json({ success: false, error: "Missing Pexels API key" });
    }

    // Khởi tạo Pexels client
    const pexelsClient = createClient(pexelsApiKey);
    
    // Sử dụng trực tiếp mô tả ảnh để tìm kiếm thay vì trích xuất từ khóa
    // Làm sạch mô tả ảnh: loại bỏ các ký tự đặc biệt và giới hạn độ dài
    const cleanDescription = imageDescription
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // Sử dụng toàn bộ mô tả nếu ngắn hơn 50 ký tự, hoặc lấy 50 ký tự đầu tiên
    const searchQuery = cleanDescription.length <= 50 
      ? cleanDescription 
      : cleanDescription.substring(0, 50);
    
    console.log(`Tìm kiếm ảnh với mô tả: "${searchQuery}"`);
    
    // Xác định kích thước theo nền tảng
    const dimensions = PLATFORM_DIMENSIONS[platform as keyof typeof PLATFORM_DIMENSIONS] || PLATFORM_DIMENSIONS.default;
    
    // Tìm kiếm ảnh trên Pexels sử dụng trực tiếp mô tả ảnh
    const searchResults = await pexelsClient.photos.search({
      query: searchQuery,
      orientation: dimensions.width > dimensions.height ? 'landscape' : (dimensions.width < dimensions.height ? 'portrait' : 'square'),
      size: 'large', // Ưu tiên ảnh có độ phân giải cao
      per_page: 10 // Lấy 10 kết quả để chọn ảnh phù hợp nhất
    });
    
    // Kiểm tra kết quả trả về có phải là lỗi không
    if ('error' in searchResults) {
      return res.status(500).json({ success: false, error: searchResults.error });
    }
    
    // Kiểm tra có kết quả nào không
    if (!searchResults.photos || searchResults.photos.length === 0) {
      return res.status(404).json({ success: false, error: "No images found" });
    }
    
    // Lấy tối đa 6 ảnh đầu tiên để người dùng có thể chọn
    const photos = searchResults.photos.slice(0, 6);
    
    // Chuẩn bị dữ liệu trả về cho mỗi ảnh
    const imagesData = photos.map(photo => ({
      id: photo.id,
      url: photo.src.large,
      thumbnail: photo.src.medium,
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      alt: photo.alt || searchQuery,
      pexels_url: photo.url
    }));
    
    // Mặc định chọn ảnh đầu tiên (phổ biến nhất)
    const defaultImage = imagesData[0];
    
    // Trả về kết quả với tất cả các ảnh tìm thấy
    return res.status(200).json({
      success: true,
      imageUrl: defaultImage.url,
      direct_image_url: defaultImage.url,
      image_data: defaultImage,
      all_images: imagesData,
      index: segmentIdx,
      keyword: searchQuery
    });
    
  } catch (error: any) {
    console.error("Error searching Pexels images:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
}
