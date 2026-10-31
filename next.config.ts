import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El cliente de libSQL usa un binario nativo para archivos locales
  // msedge-tts usa ws, que se rompe si Next.js lo empaqueta
  serverExternalPackages: ["@libsql/client", "libsql", "msedge-tts", "ws"],
};

export default nextConfig;
