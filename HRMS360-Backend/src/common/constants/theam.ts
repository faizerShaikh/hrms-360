export const singleGapTheamConfig = {
  mode: "jit",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Add extra paths here
  ],
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
  },
  variants: {
    extend: {},
  },
  plugins: [],
};

export const dualGapTheamConfig = {
  // mode: "jit",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Add extra paths here
  ],
  theme: {
    extend: {
      colors: {
        main: "#828282",
        primary: "#0069FF",
        "primary-light": "#F5F9FF",
        secondary: "#FFCD00",
        "secondary-light": "#F7F3E1",
        tertiary: "#78909C",
        "tertiary-light": "#F2F5F7",
        "fc-dark": "#4D4D4D",
        "fc-light": "#616161",
        "fc-main": "#828282",
      },
      fontSize: {
        "semi-base": "15px", //"0.938rem",
      },
      screen: {
        print: { raw: "print" },
        screen: { raw: "screen" },
      },
    },
    fontFamily: {
      urbanist: ["Urbanist", "sans-serif"],
      inter: ["Inter", "sans-serif"],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
