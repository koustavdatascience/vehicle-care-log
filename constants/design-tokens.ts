/** Vehicle Care Log layout tokens. Colors remain in the runtime palette. */
export const layoutTokens = {
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 22, xl: 28, xxl: 34 },
  radius: { sm: 12, md: 16, lg: 22, pill: 999 },
  typography: { display: 30, title: 24, heading: 18, body: 16, label: 14, caption: 13 },
  touchTarget: 44,
  elevation: {
    card: {
      boxShadow: "0px 8px 20px rgba(16, 42, 67, 0.06)",
      elevation: 3,
    },
  },
} as const;
