import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lexical-playground/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      width: {
        '100': '25rem',     // 400px
        '120': '30rem',     // 480px
        '140': '35rem',     // 560px
        '160': '40rem',     // 640px
        '180': '45rem',     // 720px
        '200': '50rem',     // 800px
        '240': '60rem',     // 960px
        '280': '70rem',     // 1120px
        '320': '80rem',     // 1280px
        '360': '90rem',     // 1440px
        '400': '100rem',    // 1600px
      },
      maxWidth: {
        '100': '25rem',     // 400px
        '120': '30rem',     // 480px
        '140': '35rem',     // 560px
        '160': '40rem',     // 640px
        '180': '45rem',     // 720px
        '200': '50rem',     // 800px
        '240': '60rem',     // 960px
        '280': '70rem',     // 1120px
        '320': '80rem',     // 1280px
        '360': '90rem',     // 1440px
        '400': '100rem',    // 1600px
      },
      minWidth: {
        '100': '25rem',     // 400px
        '120': '30rem',     // 480px
        '140': '35rem',     // 560px
        '160': '40rem',     // 640px
        '180': '45rem',     // 720px
        '200': '50rem',     // 800px
        '240': '60rem',     // 960px
        '280': '70rem',     // 1120px
        '320': '80rem',     // 1280px
        '360': '90rem',     // 1440px
        '400': '100rem',    // 1600px
      }
    },
  },
  plugins: [],
} satisfies Config;
