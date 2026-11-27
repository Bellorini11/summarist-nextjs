import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["jwks-rsa", "jose"],
};

export default nextConfig;
