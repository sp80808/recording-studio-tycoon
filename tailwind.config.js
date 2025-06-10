/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Your main HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // All relevant files in your src directory
  ],
  theme: {
    extend: {
      // You can extend Tailwind's default theme here
      // e.g., colors, fonts, spacing, etc.
      colors: {
        border: '#e5e7eb', // Custom border color (matches Tailwind's gray-200)
        background: '#f8fafc',  // add this (Tailwind's gray-50 or your preferred color)
        foreground: '#18181b',  // (optional) for text, Tailwind's zinc-900
        // Add more tokens as needed (e.g., 'primary', 'secondary', etc.)
      },
    },
  },
  plugins: [
    // You can add Tailwind plugins here if needed
  ],
};