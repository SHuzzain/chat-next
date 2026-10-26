import { withAui } from "@assistant-ui/next";
import type { NextConfig } from "next";
import { withEve } from "eve/next";

const lmsOrigin = process.env.LMS_FRONTEND_ORIGIN || "http://localhost:3100";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  transpilePackages: ["@assistant-ui/eve", "@assistant-ui/react"],
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${lmsOrigin}`,
          },
        ],
      },
      {
        source: "/chatbot-widget.js",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: lmsOrigin,
          },
          {
            key: "Cache-Control",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

export default withEve(withAui(nextConfig));
