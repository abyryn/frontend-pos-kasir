// Typography scale from design.md — Inter font

export const FontFamily = {
  regular: 'System',   // Inter falls back to system font on RN
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const FontSize = {
  display: 36,
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 18,
  bodyLarge: 16,
  body: 14,
  bodySmall: 13,
  caption: 12,
  button: 14,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
