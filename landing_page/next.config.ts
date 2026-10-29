import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  agentRules: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "192.168.1.4", ...(process.env.DEV_ORIGINS?.split(",").map((origin) => origin.trim()) ?? [])],
};

export default nextConfig;
