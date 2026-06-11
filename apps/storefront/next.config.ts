import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@deeprastore/infrastructure", "@deeprastore/core-domain"],
};

export default nextConfig;
