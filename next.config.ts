import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase): NextConfig => {
    const isDev = phase === PHASE_DEVELOPMENT_SERVER;

    return {
        env: {},
        serverExternalPackages: ["@neondatabase/serverless"],
    };
};

export default nextConfig;
