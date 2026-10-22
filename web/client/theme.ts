/* eslint-disable @typescript-eslint/naming-convention */
import { ColorSystemOptions, createTheme, outlinedInputClasses } from "@mui/material";

export const COLOR_SCHEME_KEY = "mui-mode";
export const parseColorScheme = (value: string | null | undefined) => value === "dark" ? "dark" : "light";

const palette = (mode: "light" | "dark"): ColorSystemOptions["palette"] => ({
  primary: mode === "light"
    ? { main: '#1b1c1d' }
    : { main: '#e0e1e2' },
  secondary: {
    main: '#1b94d1',
  },
  // Cables share secondary's hue. Dark mode has a bright outline and only the fill lights up with audio
  audio: mode === "light"
    ? {
      device: '#dad4c9',
      deviceBorder: '#bfbfbf',
      cable: '#3d6877',
      cableActive: '#26a4e3',
      cableBorder: '#1b94d1',
      input: '#873535',
      inputActive: '#c44949',
      output: '#348134',
      outputActive: '#48c648',
    }
    : {
      device: '#222222',
      deviceBorder: '#3a3a3a',
      cable: '#0c3245',
      cableActive: '#26a4e3',
      cableBorder: '#1b94d1',
      input: '#873535',
      inputActive: '#c44949',
      output: '#348134',
      outputActive: '#48c648',
    },
  background: mode === "light"
    ? {
      default: '#EDE6D5',
      paper: '#ffffff',
      panel: '#ffffff',
      tabs: '#1b1c1d',
      tabHover: '#313233',
      tabActive: '#313233',
      empty: '#dddddd',
      board: '#d3d3d3',
      boardDots: '#b3b3b3',
      terminal: '#2d2d2d',
    }
    : {
      default: '#0c0d13',
      paper: '#1c1c22',
      panel: '#14141b',
      tabs: '#000000',
      tabHover: '#22222c',
      tabActive: '#14141b',
      empty: '#1a1a1a',
      board: '#06070f',
      boardDots: '#262c31',
      terminal: '#151515',
    },
});

const theme = createTheme({
  colorSchemes: {
    light: { palette: palette("light") },
    dark: { palette: palette("dark") },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiButtonGroup: {
      defaultProps: {
        disableElevation: true,
      },
    },
    // Inputs are focused with secondary (the accent) instead of primary, which is nearly white in dark mode
    MuiTextField: {
      defaultProps: {
        color: "secondary",
      },
    },
    MuiFormControl: {
      defaultProps: {
        color: "secondary",
      },
    },
    MuiInput: {
      defaultProps: {
        color: "secondary",
      },
    },
    MuiFilledInput: {
      defaultProps: {
        color: "secondary",
      },
    },
    MuiOutlinedInput: {
      defaultProps: {
        color: "secondary",
      },
      styleOverrides: {
        root: ({ theme }) => ({
          [`&:hover:not(.${outlinedInputClasses.disabled}):not(.${outlinedInputClasses.error}) .${outlinedInputClasses.notchedOutline}`]: {
            borderColor: theme.palette.secondary.main,
          },
        }),
      },
    },
  },
});

export default theme;

declare module '@mui/material/styles' {
  interface PaletteOptions {
    audio?: Palette["audio"];
  }
  
  interface Palette {
    audio: {
      device: string;
      deviceBorder: string;
      cable: string;
      cableActive: string;
      cableBorder: string;
      input: string;
      inputActive: string;
      output: string;
      outputActive: string;
    };
  }
  
  interface TypeBackground {
    panel: string;
    tabs: string;
    tabHover: string;
    tabActive: string;
    empty: string;
    board: string;
    boardDots: string;
    terminal: string;
  }
}
