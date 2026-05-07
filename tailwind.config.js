/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: "#1d4ed8", light: "#3b82f6", dark: "#1e3a8a" },
        critical: "#dc2626",
        warning:  "#ea580c",
        success:  "#16a34a",
      },
    },
  },
  plugins: [],
};
