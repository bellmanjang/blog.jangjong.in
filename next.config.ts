import type {NextConfig} from "next";
import {PHASE_DEVELOPMENT_SERVER} from "next/constants";

const nextConfig = (phase): NextConfig => {
    const isDev = phase === PHASE_DEVELOPMENT_SERVER;

    return {
        env: {
            BASE_URL: isDev ? "http://localhost:3000" : "https://blog.jangjong.in",
        }
    }
};

export default nextConfig;
