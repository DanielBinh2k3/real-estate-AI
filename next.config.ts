import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.geoapify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'masterisevietnam.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'masteriwaterfrontoceanpark.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'masterihomes.com.vn',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
