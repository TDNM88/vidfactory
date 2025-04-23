import type React from "react";
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}