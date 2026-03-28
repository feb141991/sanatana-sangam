import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  "#fff8f0",
          100: "#feebd6",
          200: "#fcd5ac",
          300: "#fab878",
          400: "#f89043",
          500: "#f6721e",
          600: "#e75a13",
          700: "#c04311",
          800: "#993617",
          900: "#7c2f16",
        },
        sacred: {
          gold:    "#d4a017",
          red:     "#8b0000",
          maroon:  "#7B1A1A",
          maroonDark: "#5c1212",
          maroonLight: "#a02222",
          cream:   "#F5F0E8",
          saffron: "#ff7722",
          orange:  "#E8640A",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        devanagari: ["Noto Sans Devanagari", "sans-serif"],
      },
      backgroundImage: {
        "gradient-sacred": "linear-gradient(135deg, #ff7722 0%, #d4a017 100%)",
        "gradient-subtle": "linear-gradient(180deg, #fff8f0 0%, #fdf6e3 100%)",
      },
      boxShadow: {
        sacred: "0 4px 20px rgba(255, 119, 34, 0.15)",
        card:   "0 2px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
