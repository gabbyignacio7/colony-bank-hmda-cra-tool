import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conditionally import Replit plugins only when running on Replit
const isReplit = process.env.REPL_ID !== undefined;

// Base path configuration:
// - For private GitHub Pages (random subdomain like xxx.pages.github.io): use "/"
// - For public GitHub Pages (org.github.io/repo): use "/repo-name/"
// - For local development: use "/"
// Currently using "/" since the repo has private GitHub Pages enabled
const basePath = "/";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Only add Replit plugins when running on Replit
    ...(isReplit && process.env.NODE_ENV !== "production"
      ? [
          // These are loaded dynamically to avoid errors when not on Replit
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(__dirname, "client"),
  // GitHub Pages deployment - use repo name as base path
  base: basePath,
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
