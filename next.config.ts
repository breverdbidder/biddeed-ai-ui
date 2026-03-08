import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "www.bcpao.us", pathname: "/photos/**" },
    ],
  },
  // Mapbox GL requires this to avoid SSR issues
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
