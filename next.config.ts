import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly disable trailing slashes to avoid Link href hydration mismatches.
  trailingSlash: false,
};

export default nextConfig;