import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@family/audit",
    "@family/connectors",
    "@family/core",
    "@family/security",
    "@family/config"
  ]
};

export default nextConfig;

