/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F7FA",
        card: "#FFFFFF",
        border: "#E2E8F0",
        primary: {
          DEFAULT: "#0F172A",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        secondary: "#64748B",
        gradeA: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
          border: "#86EFAC"
        },
        urs: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
          border: "#FDE68A"
        },
        defect: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
          border: "#FCA5A5"
        },
        ai: {
          DEFAULT: "#4F46E5",
          light: "#EEF2FF",
          border: "#C7D2FE",
          accent: "#7C3AED"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        card: "14px",
      }
    },
  },
  plugins: [],
}
