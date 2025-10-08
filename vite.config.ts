import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  optimizeDeps: {
    exclude: ["pdfjs-dist"],
  },
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "pdfjs-dist/build/pdf.worker.mjs": "pdfjs-dist/build/pdf.worker.min.mjs",
    },
  },
});
