import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  "#FDFBF7",
          100: "#F4EFE6",
          200: "#EFE3CF",
          300: "#D8BF99",
          400: "#B98A4A",
          500: "#8E5E2A",
          600: "#7A5126",
          700: "#6C431D",
          800: "#5F3A16",
          900: "#211B14",
        },
        sacred: {
          gold:    "#8E5E2A",
          red:     "#6C431D",
          maroon:  "#7A5126",
          maroonDark: "#5F3A16",
          maroonLight: "#EFE3CF",
          cream:   "#FDFBF7",
          saffron: "#B98A4A",
          orange:  "#8E5E2A",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        devanagari: ["Noto Sans Devanagari", "sans-serif"],
      },
      backgroundImage: {
        "gradient-sacred": "linear-gradient(135deg, #6C431D 0%, #8E5E2A 100%)",
        "gradient-subtle": "linear-gradient(180deg, #FDFBF7 0%, #F4EFE6 100%)",
      },
      boxShadow: {
        sacred: "0 4px 20px rgba(49, 35, 20, 0.10)",
        card:   "0 2px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
