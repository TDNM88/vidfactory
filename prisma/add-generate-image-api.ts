import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Kiểm tra xem API đã tồn tại chưa
    const existingApi = await prisma.apiPricing.findUnique({
      where: {
        apiName: 'generate-image'
      }
    });

    if (existingApi) {
      console.log('API generate-image đã tồn tại trong hệ thống giá');
      return;
    }

    // Thêm API generate-image vào bảng apiPricing
    const newApi = await prisma.apiPricing.create({
      data: {
        apiName: 'generate-image',
        creditCost: 1, // Đặt mức giá phù hợp
        displayName: 'Tạo ảnh',
        description: 'Tạo ảnh từ mô tả hoặc tìm kiếm ảnh từ Pexels',
        isActive: true,
        sortOrder: 2 // Đặt thứ tự hiển thị phù hợp
      }
    });

    console.log('Đã thêm API generate-image vào hệ thống giá:', newApi);
  } catch (error) {
    console.error('Lỗi khi thêm API generate-image:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
