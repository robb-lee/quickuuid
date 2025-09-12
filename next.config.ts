import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle optimization
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons"
    ]
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },

  // Build optimizations (swcMinify is now default in Next.js 14+)
  
  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"]
  },

  // Bundle analyzer support
  ...(process.env.ANALYZE === "true" && {
    experimental: {
      ...process.env.NODE_ENV === "production" && { bundlePagesRouterDependencies: true }
    }
  })
};

export default nextConfig;
