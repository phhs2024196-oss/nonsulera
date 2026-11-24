import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  // 외부에 알리는 짧은 다운로드 주소: /download/jipijigi → 집계 후 파일로 이동
  async rewrites() {
    return [{ source: "/download/:slug", destination: "/api/download/:slug" }];
  },
};

export default config;
