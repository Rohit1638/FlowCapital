import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/login?portal=1", permanent: false },
      { source: "/assets/:path*", destination: "/login?portal=1", permanent: false },
      { source: "/events/:path*", destination: "/login?portal=1", permanent: false },
      { source: "/intelligence/:path*", destination: "/login?portal=1", permanent: false },
      { source: "/decisions/:path*", destination: "/login?portal=1", permanent: false },
      { source: "/allocation", destination: "/login?portal=1", permanent: false },
      { source: "/simulator", destination: "/login?portal=1", permanent: false },
      { source: "/integrations", destination: "/login?portal=1", permanent: false },
      { source: "/alerts", destination: "/login?portal=1", permanent: false },
      { source: "/settings", destination: "/login?portal=1", permanent: false },
      { source: "/financing", destination: "/login?portal=1", permanent: false },
      { source: "/risk", destination: "/login?portal=1", permanent: false },
      { source: "/demo/:path*", destination: "/login?portal=1", permanent: false },
    ];
  },
};

export default nextConfig;
