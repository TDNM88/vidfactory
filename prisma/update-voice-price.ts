import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateVoicePrice() {
  try {
    // Kiểm tra xem API generate-voice có tồn tại trong bảng apiPricing không
    const existingApi = await prisma.apiPricing.findUnique({
      where: { apiName: 'generate-voice' },
    });

    if (existingApi) {
      // Nếu đã tồn tại, cập nhật giá thành 1.5 credits
      const updatedApi = await prisma.apiPricing.update({
        where: { apiName: 'generate-voice' },
        data: {
          creditCost: 1.5,
        },
      });
      
      console.log('Đã cập nhật giá cho API generate-voice:', updatedApi);
    } else {
      // Nếu chưa tồn tại, thêm mới với giá 1.5 credits
      const newApi = await prisma.apiPricing.create({
        data: {
          apiName: 'generate-voice',
          creditCost: 1.5,
          displayName: 'Tạo giọng đọc',
          description: 'Tạo giọng đọc từ văn bản sử dụng F5-TTS hoặc VixTTS',
          sortOrder: 3,
        },
      });
      
      console.log('Đã thêm mới API generate-voice với giá 1.5 credits:', newApi);
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật giá cho API generate-voice:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVoicePrice()
  .then(() => console.log('Hoàn tất cập nhật giá'))
  .catch((error) => console.error('Lỗi:', error));
