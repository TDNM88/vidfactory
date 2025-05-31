# Hướng dẫn triển khai TDNM App

Hướng dẫn này cung cấp các bước chi tiết để triển khai ứng dụng Next.js TDNM với hỗ trợ ffmpeg lên Azure Web App và Render.com.

## Yêu cầu hệ thống

- Node.js 20.x
- npm hoặc yarn
- Git
- Tài khoản Azure (cho triển khai Azure)
- Tài khoản Render.com (cho triển khai Render.com)

## Biến môi trường

Đảm bảo các biến môi trường sau được cấu hình trong môi trường triển khai của bạn:

```
OPENAI_API_KEY
OPENROUTER_API_KEY
TENSOR_API_URL
TENSOR_API_KEY
HF_TOKEN
GEMINI_API_KEY
VIDU_API_KEY
PEXELS_API_KEY
GROQ_API_KEY
DATABASE_URL
NEXT_PUBLIC_BASE_URL
```

## Triển khai lên Azure Web App

### Phương pháp 1: GitHub Actions CI/CD (Khuyến nghị)

1. Đẩy mã nguồn lên GitHub
2. Tạo một Azure Web App
   - Chọn Node.js 20 LTS làm runtime stack
   - Chọn gói giá phù hợp (gói Free có giới hạn)
3. Cấu hình GitHub Actions
   - File workflow đã được thiết lập tại `.github/workflows/azure-deploy.yml`
   - Thêm Azure publish profile vào GitHub Secrets với tên `AZUREAPPSERVICE_PUBLISHPROFILE_20FD8F6F7C40437CB2B549909CE95E02`
   - Thêm tất cả API keys cần thiết vào GitHub Secrets

4. Kích hoạt workflow bằng cách đẩy mã lên nhánh main hoặc thủ công từ tab GitHub Actions

### Phương pháp 2: Triển khai Docker

1. Tạo một Azure Container Registry
2. Build và đẩy Docker image sử dụng Dockerfile đã cung cấp
3. Tạo một Azure Web App với Docker container
4. Cấu hình Web App để sử dụng Docker image của bạn

## Triển khai lên Render.com

### Phương pháp 1: Triển khai Web Service

1. Tạo một Web Service mới trên Render.com
2. Kết nối repository GitHub của bạn
3. Chọn "Node" làm môi trường
4. Đặt lệnh build: `chmod +x ./render-build.sh && ./render-build.sh`
5. Đặt lệnh start: `./start.sh`
6. Đặt phiên bản Node.js là 20.x
7. Thêm tất cả biến môi trường cần thiết
8. Triển khai dịch vụ

### Phương pháp 2: Triển khai Docker

1. Tạo một Web Service mới trên Render.com
2. Kết nối repository GitHub của bạn
3. Chọn "Docker" làm môi trường
4. Chỉ định `render.dockerfile` làm đường dẫn Docker file
5. Thêm tất cả biến môi trường cần thiết
6. Triển khai dịch vụ

## Xử lý sự cố

### Vấn đề thường gặp

1. **Lỗi không tìm thấy module**
   - Kiểm tra thư mục `lib` không bị loại trừ trong `tsconfig.json`
   - Xác minh các path alias trong `tsconfig.json` khớp với các câu lệnh import

2. **Không tìm thấy ffmpeg**
   - Đối với Azure: Kiểm tra `startup.sh` đang cài đặt ffmpeg đúng cách
   - Đối với Render: Xác minh script build đang cài đặt ffmpeg đúng cách

3. **Phiên bản Node.js không khớp**
   - Đảm bảo bạn đang sử dụng Node.js 20.x trong tất cả môi trường
   - Kiểm tra package.json về yêu cầu phiên bản Node.js

4. **Lỗi build**
   - Kiểm tra log build để biết lỗi cụ thể
   - Xác minh tất cả dependencies được cài đặt đúng cách
   - Đảm bảo biến môi trường được đặt đúng

5. **Lỗi runtime**
   - Kiểm tra log ứng dụng
   - Xác minh ffmpeg được cài đặt đúng cách và có thể truy cập
   - Kiểm tra vấn đề quyền truy cập file

## Giới hạn của gói Free

### Giới hạn của Azure Free Tier

- Tài nguyên CPU và bộ nhớ hạn chế
- Ứng dụng sẽ ngủ sau 20 phút không hoạt động
- Không hỗ trợ tên miền tùy chỉnh
- Bộ nhớ lưu trữ hạn chế (khuyến nghị sử dụng bộ nhớ ngoài cho file media)
- Khả năng xử lý video hạn chế do giới hạn tài nguyên

### Giới hạn của Render.com Free Tier

- Tài nguyên CPU và bộ nhớ hạn chế
- Dịch vụ sẽ tắt sau 15 phút không hoạt động
- Số phút build hạn chế mỗi tháng
- Băng thông hạn chế
- Không có lưu trữ đĩa cố định (file là tạm thời)

## Thực hành tốt nhất

1. **Biến môi trường**
   - Lưu trữ thông tin nhạy cảm trong biến môi trường
   - Không bao giờ commit API keys hoặc secrets vào repository

2. **Lưu trữ media**
   - Sử dụng dịch vụ lưu trữ bên ngoài (như Azure Blob Storage) cho file media
   - Triển khai quy trình dọn dẹp để quản lý file tạm thời

3. **Giám sát**
   - Thiết lập giám sát cho ứng dụng của bạn
   - Thường xuyên kiểm tra log để phát hiện lỗi

4. **Hiệu suất**
   - Cân nhắc nâng cấp lên gói trả phí cho workload sản xuất
   - Tối ưu hóa các hoạt động ffmpeg để cải thiện hiệu suất

5. **Mở rộng**
   - Cân nhắc sử dụng dịch vụ chuyên dụng cho xử lý video nặng
   - Triển khai xử lý dựa trên hàng đợi cho các hoạt động video

## Cấu hình đặc biệt cho TDNM App

### Xử lý âm thanh và video

TDNM App sử dụng ffmpeg để xử lý âm thanh và video. Đảm bảo ffmpeg được cài đặt đúng cách trong môi trường triển khai:

- Trên Azure, `startup.sh` sẽ cài đặt ffmpeg khi ứng dụng khởi động
- Trên Render.com, `render-build.sh` sẽ cài đặt ffmpeg trong quá trình build

### Thư mục lưu trữ

Ứng dụng cần các thư mục sau để lưu trữ nội dung tạo ra:

```
public/generated-audios
public/generated-images
public/generated-videos
```

Các script triển khai đã được cấu hình để tạo các thư mục này tự động.

### API bên ngoài

TDNM App sử dụng nhiều API bên ngoài:

- OpenAI API
- Groq API
- Google Gemini API
- VixTTS (thông qua Hugging Face)
- Pexels API

Đảm bảo tất cả API keys được cấu hình đúng trong biến môi trường.

## Kiểm tra triển khai

Sau khi triển khai, kiểm tra các chức năng sau để đảm bảo ứng dụng hoạt động đúng:

1. Tạo kịch bản (sử dụng Groq API)
2. Tạo giọng đọc (sử dụng VixTTS và ffmpeg)
3. Tạo hình ảnh (sử dụng các API AI)
4. Tạo video (sử dụng ffmpeg)

Nếu bất kỳ chức năng nào không hoạt động, kiểm tra log ứng dụng để tìm lỗi cụ thể.
