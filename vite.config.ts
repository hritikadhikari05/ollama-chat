import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    proxy: {
      "/api/chat": {
        target: "https://ollama.hritikadhikari.com.np",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, "/api/chat"),
      },
    },
  },
})
