import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // يضمن أن جميع روابط الملفات تبدأ بمسار نسبي
  build: {
    outDir: 'dist', // المجلد الذي سيقرأ منه Netlify
  }
})
