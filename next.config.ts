import type { NextConfig } from "next";
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  transpilePackages: ['edge-tts'],
  allowedDevOrigins: ["all"],
  experimental: {
    swcPlugins: [
      ["@swc/plugin-transform-typescript", { module: "esnext" }],
    ],
  },
};

export default nextConfig;