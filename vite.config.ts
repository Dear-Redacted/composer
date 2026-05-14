import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import svgr from "vite-plugin-svgr";

export default defineConfig(() => {
  const shouldAnalyzeBundle = process.env.ANALYZE === "true";

  return {
    base: "./",
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
      shouldAnalyzeBundle &&
        visualizer({
          filename: "dist/bundle-report.html",
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: "treemap",
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      host: "127.0.0.1",
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
