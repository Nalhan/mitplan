import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    assetsInclude: ['**/*.yaml'],
    envDir: path.resolve(__dirname, '..'),
    define: {
      'process.env': env,
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(process.env.REACT_APP_BACKEND_URL)
    }
  }
})