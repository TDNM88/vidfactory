import type React from "react";
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import UserStatus from "@/components/UserStatus";
import { UserStatusProvider } from "@/components/UserStatusContext";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Cho phép zoom tối đa
  userScalable: "yes", // Cho phép người dùng zoom
};

export const metadata: Metadata = {
  title: "Tạo Video Mạng Xã Hội - AI Video Generator",
  description:
    "Tạo video mạng xã hội chuyên nghiệp chỉ trong vài phút với công nghệ AI tiên tiến. Dễ dàng, nhanh chóng, hiệu quả!",
  authors: [{ name: "TDNM" }],
  keywords: [
    "tạo video AI",
    "video mạng xã hội",
    "AI video generator",
    "tạo video chuyên nghiệp",
    "công cụ tạo video",
  ],
  openGraph: {
    title: "Tạo Video Mạng Xã Hội - AI Video Generator",
    description:
      "Sản xuất video mạng xã hội nhanh chóng với AI. Tạo video chuyên nghiệp chỉ trong vài phút!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tạo Video Mạng Xã Hội - AI Video Generator",
    description:
      "Sản xuất video mạng xã hội nhanh chóng với AI. Tạo video chuyên nghiệp chỉ trong vài phút!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        <UserStatusProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="w-full flex flex-wrap justify-between items-center gap-2 px-2 py-2 border-b bg-white/80 dark:bg-gray-900/80 z-50 sticky top-0">
              <div className="text-xs text-gray-500 truncate max-w-[60vw] select-none">
                Ứng dụng được phát triển bởi <span className="font-semibold text-primary">TDNM</span> - mọi chi tiết xin liên hệ: <a href="mailto:aigc.tdnm@gmail.com" className="underline hover:text-primary">aigc.tdnm@gmail.com</a> hoặc hotline: <a href="tel:0984519098" className="underline hover:text-primary">0984 519 098</a>
              </div>
              <UserStatus />
            </div>
            {children}
          </ThemeProvider>
        </UserStatusProvider>
      </body>
    </html>
  );
}