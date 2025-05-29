/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")], // ✅ Add DaisyUI
  daisyui: {
    themes: ["light", "dark"], // Only include light and dark themes
  }
};
