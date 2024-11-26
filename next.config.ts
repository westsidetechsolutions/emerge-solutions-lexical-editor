import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {ignoreDuringBuilds: true},
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  assetPrefix: './',
};

export default nextConfig;
