import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages
  output: "export",
  trailingSlash: true,
  images: {
    // Required for static export — images served unoptimized
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.bcpao.us",
        pathname: "/photos/**",
      },
    ],
  },
};

export default nextConfig;
