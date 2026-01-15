import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // نصيحة: base: './' قد تسبب مشاكل في المسارات (Routes) على Vercel 
  // يفضل تركها '/' إذا كنت تستخدم React Router
  base: '/', 
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, 
    
    rollupOptions: {
      output: {
        // تحسين تقسيم الملفات بشكل أدق
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['xlsx', 'framer-motion'],
          'vendor-icons': ['lucide-react', 'react-icons']
        }
      }
    }
  }
})
