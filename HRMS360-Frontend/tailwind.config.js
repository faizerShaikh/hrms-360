/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Add extra paths here
  ],
  corePlugins: {
    preflight: false,
  },
  important: "#main",
  theme: {
    extend: {
      colors: {
        one: "#ff0000",
        dark: "#4D4D4D",
        light: "#616161",
        main: "#828282",
        primary: "#6CBE45",
        "primary-light": "#EEFBDB",
        secondary: "#F7941D",
        "secondary-light": "#FEF2D1",
        tertiary: "#78909C",
        "tertiary-light": "#F2F5F7",
        "fc-dark": "#4D4D4D",
        "fc-light": "#616161",
        "fc-main": "#828282",
        initiated: "#1ABBB9",
        inProgress: "#FFB508",
        success: "#18AB56",
        cancelled: "#EB5757",
        grid: "#333333",
        chip: "#F7FDEE",
      },

      fontSize: {
        "semi-base": "15px", //"0.938rem",
      },
    },

    fontFamily: {
      // "aller": ["Aller", "sans-serif"],
      // "aller-display": ["Aller Display", "sans-serif"],
      // "aller-light": ["Aller Light", "sans-serif"],
      // "century-gotic": ["Century Gothic", "sans-serif"],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
