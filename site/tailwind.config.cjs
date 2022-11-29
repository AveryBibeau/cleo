/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["!./node_modules/**", "./index.html", "./**/*.{js,ts,jsx,tsx}"],
  experimental: {
    optimizeUniversalDefaults: true,
  },
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
