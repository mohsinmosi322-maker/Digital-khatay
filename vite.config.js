import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Important for GitHub Pages – set to your repo name if deploying under username.github.io/repo-name
  // For username.github.io (root) use '/', for project pages use '/repo-name/'
  base: process.env.NODE_ENV === 'production' ? '/digital-khata/' : '/',
})
