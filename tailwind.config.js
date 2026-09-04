/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "monospace",
        ],
        serif: [
          "Playfair Display",
          "Georgia",
          "serif",
        ],
      },
      colors: {
        canvas: {
          light: "#fbfbfb",
          dark: "#0b0b0d",
        },
      },
    },
  },
  plugins: [],
};
