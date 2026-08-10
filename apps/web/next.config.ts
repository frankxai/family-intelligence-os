import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
