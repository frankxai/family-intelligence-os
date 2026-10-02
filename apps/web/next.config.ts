import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd().replace(/\/apps\/web$/, ""),
  transpilePackages: [
    "@family/audit",
    "@family/auth",
    "@family/claims",
    "@family/consent",
    "@family/connectors",
    "@family/core",
    "@family/evidence",
    "@family/security",
    "@family/succession",
    "@family/config"
  ]
};

export default nextConfig;
