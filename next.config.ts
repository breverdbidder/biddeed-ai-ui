import type { NextConfig } from "next";

const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? "/biddeed-ai-ui" : "",
  assetPrefix: isGitHubPages ? "/biddeed-ai-ui/" : "",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "www.bcpao.us", pathname: "/photos/**" },
    ],
  },
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
