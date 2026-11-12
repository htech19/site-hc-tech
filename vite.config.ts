import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Strip console/debugger in production builds (keeps dev DX intact)
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : undefined,
  build: {
    outDir: "dist",
    sourcemap: false, // never expose source maps in production
    reportCompressedSize: false,
    minify: "esbuild",
    commonjsOptions: { transformMixedEsModules: true },
  },
}));
