import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // Supabase 연동 및 동적 라우팅(Intercepting routes)을 위해 주석 처리
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
