# Deployment Guide for TDNM App | Hướng dẫn Triển khai Ứng dụng TDNM

This guide provides instructions for deploying the TDNM Next.js application with ffmpeg support to both Azure Web App and Render.com.

*Hướng dẫn này cung cấp chỉ dẫn để triển khai ứng dụng Next.js TDNM với hỗ trợ ffmpeg lên cả Azure Web App và Render.com.*

## Prerequisites | Yêu cầu tiên quyết

- Node.js 20.x
- npm or yarn
- Git
- Azure account (for Azure deployment) | Tài khoản Azure (cho triển khai Azure)
- Render.com account (for Render.com deployment) | Tài khoản Render.com (cho triển khai Render.com)

## Environment Variables | Biến Môi trường

Ensure the following environment variables are configured in your deployment environment:

*Đảm bảo các biến môi trường sau được cấu hình trong môi trường triển khai của bạn:*

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
NEXT_PUBLIC_BASE_URL
DATABASE_URL
NODE_ENV=production
```

## Azure Web App Deployment | Triển khai Azure Web App

### Option 1: GitHub Actions CI/CD (Recommended) | Tùy chọn 1: GitHub Actions CI/CD (Khuyến nghị)

1. Push your code to GitHub | Đẩy mã của bạn lên GitHub
2. Create an Azure Web App | Tạo Azure Web App
   - Select Node.js 20 LTS as the runtime stack | Chọn Node.js 20 LTS làm ngăn xếp runtime
   - Choose the appropriate pricing tier (Free tier F1 has limitations) | Chọn gói giá phù hợp (Gói miễn phí F1 có giới hạn)
3. Configure GitHub Actions | Cấu hình GitHub Actions
   - The workflow file is already set up at `.github/workflows/azure-deploy.yml` | File workflow đã được thiết lập tại `.github/workflows/azure-deploy.yml`
   - Add your Azure publish profile to GitHub Secrets as `AZUREAPPSERVICE_PUBLISHPROFILE_20FD8F6F7C40437CB2B549909CE95E02` | Thêm hồ sơ xuất bản Azure vào GitHub Secrets với tên `AZUREAPPSERVICE_PUBLISHPROFILE_20FD8F6F7C40437CB2B549909CE95E02`
   - Add all required API keys to GitHub Secrets | Thêm tất cả các khóa API cần thiết vào GitHub Secrets

4. Trigger the workflow by pushing to the main branch or manually from GitHub Actions tab | Kích hoạt workflow bằng cách đẩy lên nhánh main hoặc thủ công từ tab GitHub Actions

5. Verify the deployment using the verification tools | Xác minh việc triển khai bằng các công cụ kiểm tra
   ```bash
   npm run check-deployment:azure
   ```

### Option 2: Docker Deployment

1. Create an Azure Container Registry
2. Build and push the Docker image using the provided Dockerfile
3. Create an Azure Web App with Docker container
4. Configure the Web App to use your Docker image

## Render.com Deployment | Triển khai Render.com

### Option 1: Web Service Deployment | Tùy chọn 1: Triển khai Web Service

1. Create a new Web Service on Render.com | Tạo Web Service mới trên Render.com
2. Connect your GitHub repository | Kết nối repository GitHub của bạn
3. Select "Node" as the environment | Chọn "Node" làm môi trường
4. Set the build command to: | Đặt lệnh build thành:
   ```bash
   chmod +x ./render-build.sh && ./render-build.sh
   ```
5. Set the start command to: | Đặt lệnh khởi động thành:
   ```bash
   ./start.sh
   ```
6. Set Node.js version to 20.x | Đặt phiên bản Node.js thành 20.x
7. Add all required environment variables | Thêm tất cả các biến môi trường cần thiết
8. Configure disk storage | Cấu hình lưu trữ đĩa:
   - Add a disk named `tdnm-data` | Thêm một đĩa có tên `tdnm-data`
   - Set mount path to `/data` | Đặt đường dẫn gắn kết thành `/data`
   - Set size to at least 1GB | Đặt kích thước ít nhất là 1GB
9. Deploy the service | Triển khai dịch vụ
10. Verify the deployment using the verification tools | Xác minh việc triển khai bằng các công cụ kiểm tra
    ```bash
    npm run check-deployment:render
    ```

### Option 2: Docker Deployment

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Select "Docker" as the environment
4. Specify `render.dockerfile` as the Docker file path
5. Add all required environment variables
6. Deploy the service

## Verification Tools | Công cụ Xác minh

The application includes several tools to verify your deployment is working correctly:

*Ứng dụng bao gồm một số công cụ để xác minh triển khai của bạn đang hoạt động chính xác:*

### Health Check API | API Kiểm tra Sức khỏe

- Endpoint: `/api/health`
- Provides basic system information and ffmpeg status
- *Cung cấp thông tin cơ bản về hệ thống và trạng thái ffmpeg*

### Deployment Test API | API Kiểm tra Triển khai

- Endpoint: `/api/deployment-test`
- Verifies ffmpeg installation, directories, environment variables, and performs a test video creation
- *Xác minh cài đặt ffmpeg, thư mục, biến môi trường và thực hiện tạo video thử nghiệm*

### Verification Scripts | Script Xác minh

Run these commands locally to check your deployment:

*Chạy các lệnh này cục bộ để kiểm tra triển khai của bạn:*

```bash
# Check local ffmpeg installation
# Kiểm tra cài đặt ffmpeg cục bộ
npm run check-ffmpeg

# Check local deployment
# Kiểm tra triển khai cục bộ
npm run check-deployment

# Check Azure deployment
# Kiểm tra triển khai Azure
npm run check-deployment:azure

# Check Render.com deployment
# Kiểm tra triển khai Render.com
npm run check-deployment:render
```

## Troubleshooting | Xử lý Sự cố

### Common Issues | Vấn đề Thường gặp

1. **Module not found errors | Lỗi không tìm thấy module**
   - Check that the `lib` directory is not excluded in `tsconfig.json` | Kiểm tra thư mục `lib` không bị loại trừ trong `tsconfig.json`
   - Verify path aliases in `tsconfig.json` match import statements | Xác minh bí danh đường dẫn trong `tsconfig.json` khớp với câu lệnh import

2. **ffmpeg not found | Không tìm thấy ffmpeg**
   - For Azure: Check that `startup.sh` is correctly installing ffmpeg | Đối với Azure: Kiểm tra `startup.sh` đang cài đặt ffmpeg đúng cách
   - For Render: Verify the build script is installing ffmpeg correctly | Đối với Render: Xác minh script build đang cài đặt ffmpeg đúng cách
   - Run `/api/deployment-test` to get detailed ffmpeg status | Chạy `/api/deployment-test` để lấy trạng thái ffmpeg chi tiết

3. **Node.js version mismatch | Không khớp phiên bản Node.js**
   - Ensure you're using Node.js 20.x in all environments | Đảm bảo bạn đang sử dụng Node.js 20.x trong tất cả các môi trường
   - Check package.json for any Node.js version requirements | Kiểm tra package.json cho bất kỳ yêu cầu phiên bản Node.js nào

4. **Build failures | Lỗi build**
   - Check build logs for specific errors | Kiểm tra nhật ký build cho các lỗi cụ thể
   - Verify all dependencies are correctly installed | Xác minh tất cả các phụ thuộc được cài đặt đúng cách
   - Ensure environment variables are properly set | Đảm bảo các biến môi trường được đặt đúng cách

5. **Runtime errors | Lỗi thời gian chạy**
   - Check application logs | Kiểm tra nhật ký ứng dụng
   - Verify ffmpeg is correctly installed and accessible | Xác minh ffmpeg được cài đặt đúng cách và có thể truy cập
   - Check for file permission issues | Kiểm tra các vấn đề về quyền tệp
   - Verify media directories exist and are writable | Xác minh các thư mục phương tiện tồn tại và có thể ghi được

## Limitations of Free Tier Services | Giới hạn của Dịch vụ Gói Miễn phí

### Azure Free Tier (F1) Limitations | Giới hạn của Gói Azure Miễn phí (F1)

- Limited to 60 minutes of CPU time per day | Giới hạn 60 phút thời gian CPU mỗi ngày
- 1GB RAM | 1GB RAM
- 1GB storage | 1GB lưu trữ
- Application goes to sleep after 20 minutes of inactivity | Ứng dụng ngủ sau 20 phút không hoạt động
- No custom domain support | Không hỗ trợ tên miền tùy chỉnh
- Limited video processing capabilities due to resource constraints | Khả năng xử lý video bị hạn chế do giới hạn tài nguyên

### Render.com Free Tier Limitations | Giới hạn của Gói Render.com Miễn phí

- Limited CPU (0.1 vCPU) and memory (512MB) resources | Tài nguyên CPU (0.1 vCPU) và bộ nhớ (512MB) hạn chế
- Service spins down after 15 minutes of inactivity | Dịch vụ tắt sau 15 phút không hoạt động
- 500 build minutes per month | 500 phút build mỗi tháng
- 100GB bandwidth per month | 100GB băng thông mỗi tháng
- 1GB persistent disk storage with `/data` mount | 1GB lưu trữ đĩa liên tục với gắn kết `/data`

## Best Practices | Thực hành Tốt nhất

1. **Environment Variables | Biến Môi trường**
   - Store sensitive information in environment variables | Lưu trữ thông tin nhạy cảm trong biến môi trường
   - Never commit API keys or secrets to the repository | Không bao giờ commit khóa API hoặc bí mật vào repository
   - Use Azure App Service Configuration or Render.com Environment Variables | Sử dụng Cấu hình Dịch vụ Ứng dụng Azure hoặc Biến Môi trường Render.com

2. **Media Storage | Lưu trữ Phương tiện**
   - Use external storage services (like Azure Blob Storage) for media files | Sử dụng dịch vụ lưu trữ bên ngoài (như Azure Blob Storage) cho tệp phương tiện
   - On Render.com, use the persistent `/data` directory for important files | Trên Render.com, sử dụng thư mục liên tục `/data` cho các tệp quan trọng
   - Implement cleanup routines to manage temporary files | Triển khai quy trình dọn dẹp để quản lý các tệp tạm thời

3. **Monitoring | Giám sát**
   - Use the `/api/health` and `/api/deployment-test` endpoints for monitoring | Sử dụng các endpoint `/api/health` và `/api/deployment-test` để giám sát
   - Set up alerts for application errors | Thiết lập cảnh báo cho lỗi ứng dụng
   - Regularly check logs for errors | Thường xuyên kiểm tra nhật ký để tìm lỗi
   - Run the verification scripts periodically | Chạy các script xác minh định kỳ

4. **Performance | Hiệu suất**
   - Consider upgrading to a paid tier for production workloads | Cân nhắc nâng cấp lên gói trả phí cho khối lượng công việc sản xuất
   - Optimize ffmpeg operations for performance | Tối ưu hóa các hoạt động ffmpeg để nâng cao hiệu suất
   - Use lower resolution and bitrates for video processing on free tiers | Sử dụng độ phân giải và tốc độ bit thấp hơn cho xử lý video trên các gói miễn phí

5. **Scaling | Mở rộng**
   - Consider using a dedicated service for heavy video processing | Cân nhắc sử dụng dịch vụ chuyên dụng cho xử lý video nặng
   - Implement queue-based processing for video operations | Triển khai xử lý dựa trên hàng đợi cho các hoạt động video
   - Consider Azure Functions or Render.com Background Workers for async processing | Cân nhắc Azure Functions hoặc Render.com Background Workers cho xử lý không đồng bộ

6. **Deployment Verification | Xác minh Triển khai**
   - Always run verification tools after deployment | Luôn chạy công cụ xác minh sau khi triển khai
   - Check both health and deployment-test endpoints | Kiểm tra cả endpoint health và deployment-test
   - Verify ffmpeg functionality with a test video creation | Xác minh chức năng ffmpeg bằng cách tạo video thử nghiệm
   - Monitor disk space usage regularly | Theo dõi việc sử dụng không gian đĩa thường xuyên

## Directory Structure | Cấu trúc Thư mục

The application requires these directories for media storage:

*Ứng dụng yêu cầu các thư mục sau cho lưu trữ phương tiện:*

```
public/
  ├── generated-audios/    # For audio files | Cho tệp âm thanh
  ├── generated-images/    # For image files | Cho tệp hình ảnh
  └── generated-videos/    # For video files | Cho tệp video
tmp/                      # For temporary files | Cho tệp tạm thời
```

On Render.com, these directories are linked to persistent storage:

*Trên Render.com, các thư mục này được liên kết với bộ nhớ liên tục:*

```
/data/
  ├── generated-audios/    # Persistent storage | Lưu trữ liên tục
  ├── generated-images/    # Persistent storage | Lưu trữ liên tục
  └── generated-videos/    # Persistent storage | Lưu trữ liên tục
```

## Scripts | Các Script

The application includes several scripts for deployment and verification:

*Ứng dụng bao gồm một số script cho triển khai và xác minh:*

```
scripts/
  ├── install-ffmpeg.sh          # Installs and verifies ffmpeg | Cài đặt và xác minh ffmpeg
  ├── check-deployment.js        # Checks deployment status | Kiểm tra trạng thái triển khai
  └── verify-deployment.js       # Verifies deployment functionality | Xác minh chức năng triển khai
render-build.sh                  # Build script for Render.com | Script build cho Render.com
startup.sh                       # Startup script for Azure | Script khởi động cho Azure
start.sh                         # Startup script for Render.com | Script khởi động cho Render.com
```
