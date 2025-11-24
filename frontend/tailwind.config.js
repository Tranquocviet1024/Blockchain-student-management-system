/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#E0FBFC",
          DEFAULT: "#5ED1C1",
          dark: "#0B7285"
        },
        accent: {
          DEFAULT: "#F7B267",
          dark: "#EA7A3B"
        }
      },
      boxShadow: {
        card: "0 12px 30px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
