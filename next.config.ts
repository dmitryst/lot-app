import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static-maps.yandex.ru',
        port: '',
        pathname: '/1.x/**',
      },
      // ... здесь могут быть другие паттерны
    ],
  },
};

export default nextConfig;
