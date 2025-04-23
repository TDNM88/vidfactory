// Định nghĩa kiểu dữ liệu dùng chung cho toàn bộ workflow

export interface Segment {
  script: string;
  image_description?: string;
  direct_image_url?: string;
  image_path?: string;
  voice_url?: string;
  voice_path?: string;
  video_path?: string;
}

export interface Script {
  title: string;
  segments: Segment[];
  platform?: string;
  platform_width?: number;
  platform_height?: number;
}

export interface SessionData {
  session_id?: string; // Có thể có hoặc không, tuỳ từng bước
  subject?: string;
  summary?: string;
  platform?: string;
  duration?: number;
  script: Script;
  video_path?: string;
  thumbnail_path?: string;
}
