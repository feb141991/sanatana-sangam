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
          50:  "#fff7f9",
          100: "#f7e6eb",
          200: "#ecc0c8",
          300: "#df9cab",
          400: "#d992a3",
          500: "#c87f92",
          600: "#b86b80",
          700: "#a85e71",
          800: "#8f4d60",
          900: "#72404f",
        },
        sacred: {
          gold:    "#ECC0C8",
          red:     "#A85E71",
          maroon:  "#C87F92",
          maroonDark: "#8F4D60",
          maroonLight: "#DF9CAB",
          cream:   "#FCF5F7",
          saffron: "#DF9CAB",
          orange:  "#C87F92",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        devanagari: ["Noto Sans Devanagari", "sans-serif"],
      },
      backgroundImage: {
        "gradient-sacred": "linear-gradient(135deg, #A85E71 0%, #DF9CAB 100%)",
        "gradient-subtle": "linear-gradient(180deg, #fffafb 0%, #fdf5f7 100%)",
      },
      boxShadow: {
        sacred: "0 4px 20px rgba(168, 94, 113, 0.18)",
        card:   "0 2px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
