import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    workerThreads: false,
  },
  // Allow cross-origin requests from preview panel
  allowedDevOrigins: [
    'preview-chat-691d2654-3230-4a09-a88f-7259182faeb4.space.z.ai',
    '.space.z.ai',
    '.z.ai',
  ],
};

export default nextConfig;
