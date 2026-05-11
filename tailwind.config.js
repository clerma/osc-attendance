/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        osc: {
          primary: "#468FD8",
          deep: "#1F568C",
          light: "#A7CEF2",
          warm: "#F9F5F4",
          gray: "#DDDDDD",
          text: "#1A2942",
          mute: "#6B7A92",
          muteSoft: "#4A5A75",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
