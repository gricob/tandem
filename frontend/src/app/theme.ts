import { createTheme, type MantineColorsTuple } from '@mantine/core';

const accent: MantineColorsTuple = [
  '#e6f2ff',
  '#cde2ff',
  '#9cc3ff',
  '#67a3ff',
  '#3d88ff',
  '#2277ff',
  '#0a84ff',
  '#0068e6',
  '#005cce',
  '#004db8',
];

// Mirrors Mantine's default `dark` shade roles (0 = lightest/text ... 9 =
// darkest) but recolored to the mockup's near-black surfaces: dark.7 is the
// app background (#1c1c1e), dark.6 the card/panel surface one step lighter
// (#2c2c2e), and dark.9 the deepest background used behind the app shell.
const surface: MantineColorsTuple = [
  '#f2f2f7',
  '#e5e5ea',
  '#c7c7cc',
  '#98989d',
  '#6c6c70',
  '#48484a',
  '#2c2c2e',
  '#1c1c1e',
  '#141416',
  '#0c0c0f',
];

export const theme = createTheme({
  primaryColor: 'accent',
  primaryShade: 6,
  colors: {
    accent,
    dark: surface,
  },
  defaultRadius: 'md',
  radius: {
    xs: '6px',
    sm: '8px',
    md: '10px',
    lg: '14px',
    xl: '18px',
  },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
  headings: {
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: { radius: 'sm' },
    },
    TextInput: {
      defaultProps: { radius: 'sm' },
    },
    PasswordInput: {
      defaultProps: { radius: 'sm' },
    },
    Textarea: {
      defaultProps: { radius: 'sm' },
    },
    Select: {
      defaultProps: { radius: 'sm' },
    },
    Paper: {
      defaultProps: { radius: 'md' },
    },
    Card: {
      defaultProps: { radius: 'md' },
    },
    Modal: {
      defaultProps: { radius: 'md' },
    },
    Table: {
      defaultProps: { verticalSpacing: 'sm' },
    },
    Avatar: {
      defaultProps: { radius: 'xl' },
    },
  },
});
