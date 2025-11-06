import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure app to work under /networking subpath
  // This allows the orchestrator at gdgmanagua.dev to proxy /networking/* to this app
  basePath: '/networking',
  
  // Ensure assets are served with the correct prefix
  assetPrefix: '/networking',
  
  // Don't add trailing slashes
  trailingSlash: false,

  // Allow Server Actions from the orchestrator domain
  experimental: {
    serverActions: {
      allowedOrigins: [
        'www.gdgmanagua.dev',
        'gdgmanagua.dev',
        'devfest.raandino.dev',
        'localhost:3000',
      ],
    },
  },
};

export default nextConfig;
