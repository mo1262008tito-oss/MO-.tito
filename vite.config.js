import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    outDir: 'dist',
    // 1. زيادة حد التحذير لحجم الملفات ليناسب الكود الضخم الجديد
    chunkSizeWarningLimit: 2000, 
    
    // 2. تحسين عملية تقسيم الكود (Code Splitting) لضمان سرعة التحميل
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // وضع المكتبات الخارجية في ملف منفصل
          }
        }
      }
    }
  }
})
