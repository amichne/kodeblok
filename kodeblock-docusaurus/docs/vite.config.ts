import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const repoRoot = path.resolve(__dirname, "..");
const distRoot = path.resolve(repoRoot, "dist");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      kodeblok: path.resolve(distRoot, "index.js"),
      "kodeblok/styles.css": path.resolve(distRoot, "styles.css"),
    },
  },
  optimizeDeps: {
    include: ["@monaco-editor/react", "monaco-editor", "lucide-react"],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
});
