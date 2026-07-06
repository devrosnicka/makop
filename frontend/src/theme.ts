import { createTheme, type MantineColorsTuple } from '@mantine/core';

// A cool indigo accent — the single "electric" accent against a near-white
// background, per the "light + minimal futuristic" direction.
const brand: MantineColorsTuple = [
  '#eef1ff',
  '#dbe0fa',
  '#b3bdf0',
  '#8996e6',
  '#6774de',
  '#4f5ed9',
  '#4353d7',
  '#3644bf',
  '#2f3caa',
  '#243295',
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: { brand },
  defaultRadius: 'xs',
  fontFamily: 'InterVariable, system-ui, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono Variable", ui-monospace, monospace',
  headings: {
    fontFamily: 'InterVariable, system-ui, sans-serif',
    fontWeight: '600',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'xs',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xs',
      },
    },
    NumberInput: {
      defaultProps: {
        radius: 'xs',
      },
    },
    Card: {
      defaultProps: {
        radius: 'sm',
        withBorder: true,
      },
    },
  },
});
