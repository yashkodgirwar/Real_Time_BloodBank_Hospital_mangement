import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/register': 'http://localhost:3000',
      '/login': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/profile': 'http://localhost:3000',
      '/hospitals': 'http://localhost:3000',
      '/bloodbanks': 'http://localhost:3000',
      '/order-blood': 'http://localhost:3000',
      '/generate-bill': 'http://localhost:3000',
      '/billing': 'http://localhost:3000',
      '/hospital-names': 'http://localhost:3000',
      '/hospital-billing': 'http://localhost:3000',
      '/bloodbank-pending-bills': 'http://localhost:3000',
      '/create-razorpay-order': 'http://localhost:3000',
      '/pay-bill': 'http://localhost:3000',
      '/history': 'http://localhost:3000',
      '/request-status': 'http://localhost:3000',
      '/create-campaign': 'http://localhost:3000',
      '/campaigns': 'http://localhost:3000',
      '/update-inventory': 'http://localhost:3000',
      '/check-availability': 'http://localhost:3000',
      '/dashboard-requests': 'http://localhost:3000',
      '/approve-request': 'http://localhost:3000',
      '/hospital': 'http://localhost:3000',
      '/delete-hospital': 'http://localhost:3000',
      '/upload-profile': 'http://localhost:3000',
      '/remove-profile': 'http://localhost:3000',
      '/forgot-password': 'http://localhost:3000',
      '/reset-password': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    }
  }
})
