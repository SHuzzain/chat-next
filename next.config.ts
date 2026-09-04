import type { NextConfig } from "next";
import { withAui } from "@assistant-ui/next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "demoste.champslms.com",
      },
    ],
  },
};

export default withAui(nextConfig);
