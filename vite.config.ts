import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { databaseServerPlugin } from './src/server/databasePlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/database/**', '**/dist/**']
    }
  },
  plugins: [
    databaseServerPlugin(),
    react(),
    tailwindcss(),
  ],
})

