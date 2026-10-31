import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El cliente de libSQL usa un binario nativo para archivos locales
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
