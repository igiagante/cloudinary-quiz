/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(0.92 0.004 286.32)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.141 0.005 285.823)",
        ring: "oklch(0.705 0.015 286.067)",
        primary: {
          DEFAULT: "oklch(0.21 0.006 285.885)",
          foreground: "oklch(0.985 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(0.967 0.001 286.375)",
          foreground: "oklch(0.21 0.006 285.885)",
        },
        muted: {
          DEFAULT: "oklch(0.967 0.001 286.375)",
          foreground: "oklch(0.552 0.016 285.938)",
        },
        accent: {
          DEFAULT: "oklch(0.967 0.001 286.375)",
          foreground: "oklch(0.21 0.006 285.885)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
