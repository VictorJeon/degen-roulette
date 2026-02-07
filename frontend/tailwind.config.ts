import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'desktop': '1200px',
      },
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#111111',
        'bg-tertiary': '#1a1a1a',
        'accent': '#a3e635',
        'accent-dim': '#65a30d',
        'accent-glow': 'rgba(163, 230, 53, 0.4)',
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa',
        'text-muted': '#52525b',
        'danger': '#ff3b3b',
        'success': '#00ff88',
        'border': '#333333',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      transitionDuration: {
        '800': '800ms',
        '1500': '1500ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
