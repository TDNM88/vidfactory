-- Thêm API generate-image vào bảng ApiPricing
INSERT INTO ApiPricing (apiName, creditCost, displayName, description, isActive, sortOrder, createdAt, updatedAt)
VALUES ('generate-image', 1, 'Tạo ảnh', 'Tạo ảnh từ mô tả hoặc tìm kiếm ảnh từ Pexels', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
