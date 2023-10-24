/** @type {import('next').NextConfig} */

let domain = process.env.NEXT_PUBLIC_HOST_NAME || "192.168.10.60";

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["202.53.174.1", domain],
  },
  generateBuildId: async () => {
    // You can, for example, get the latest git commit hash here
    return "zunoks-360-build-test-01";
  },
};

module.exports = nextConfig;
