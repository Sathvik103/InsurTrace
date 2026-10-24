import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" } : {}),
  // Retired pages: old bookmarks land on the workspace that replaced them.
  async redirects() {
    return [
      { source: "/dashboards/insurer", destination: "/org/review", permanent: true },
      { source: "/dashboards/surveyor", destination: "/org/review", permanent: true },
      { source: "/dashboards/garage", destination: "/org/workshop", permanent: true },
      { source: "/dashboards/policyholder", destination: "/vehicles", permanent: true },
      { source: "/dashboards", destination: "/org", permanent: true },
      { source: "/fleet", destination: "/org/fleet", permanent: true },
      { source: "/technology", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
