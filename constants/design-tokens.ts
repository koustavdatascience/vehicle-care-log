/** Vehicle Care Log layout tokens. Colors remain in the runtime palette. */
export const layoutTokens = {
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { sm: 10, md: 14, lg: 18, pill: 999 },
  typography: { display: 30, title: 22, heading: 18, body: 16, label: 14, caption: 13 },
  touchTarget: 44,
  elevation: {
    card: {
      boxShadow: "0px 4px 12px rgba(16, 42, 67, 0.08)",
      elevation: 2,
    },
  },
} as const;
