import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E2430",
        paper: "#F4F3EF",
        panel: "#FFFFFF",
        line: "#DFDCD3",
        mute: "#6B6F76",
        navy: {
          DEFAULT: "#33456B",
          dark: "#232F4A",
          light: "#E4E9F2",
        },
        amber: {
          DEFAULT: "#A9722F",
          light: "#F2E6D3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
