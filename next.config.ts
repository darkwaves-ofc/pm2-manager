import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  api: {
    externalResolver: true,
  },
};

export default nextConfig;
