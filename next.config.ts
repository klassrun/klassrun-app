import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly disable trailing slashes to avoid Link href hydration mismatches.
  // (Some hosts add this implicitly — being explicit is safer.)
  trailingSlash: false,
};

export default nextConfig;
