/** @type {import('tailwindcss').config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/lucide-react/dist/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        background: "#fafafa",
        foreground: "#18181b",
        primary: "#ff6b35",
        secondary: "#10b981",
        muted: "#6b7280",
        card: "#ffffff",
        border: "#e5e7eb",
      }
    }
  },
  plugins: []
}