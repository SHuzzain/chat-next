import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "demoste.champslms.com"
      }
    ]
  }
};

export default nextConfig;
