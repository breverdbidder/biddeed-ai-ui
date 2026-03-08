import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "www.bcpao.us", pathname: "/photos/**" },
    ],
  },
};

export default nextConfig;
