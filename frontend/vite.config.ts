import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../', // Look for .env in the monorepo root
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios', 'socket.io-client', 'lucide-react'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Adjust limit if chunks are unavoidably large
  },
})
