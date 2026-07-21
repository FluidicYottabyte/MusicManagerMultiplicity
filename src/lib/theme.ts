import type { User } from "@prisma/client";

// Pulled from the original WPF app's App.xaml SolidColorBrush resources.
export const defaultTheme = {
  background: "#ffeca7",
  accent: "#e49364",
  foreground: "#db434c",
  accentForeground: "#c70039",
} as const;

export interface Palette {
  background: string;
  accent: string;
  foreground: string;
  accentForeground: string;
}

const hexColor = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return hexColor.test(value);
}

type ThemeFields = Pick<User, "themeBackground" | "themeAccent" | "themeForeground" | "themeAccentForeground">;

/** Falls back to the app default per-field, so a user can override just one color. */
export function paletteForUser(user: ThemeFields | null | undefined): Palette {
  return {
    background: user?.themeBackground ?? defaultTheme.background,
    accent: user?.themeAccent ?? defaultTheme.accent,
    foreground: user?.themeForeground ?? defaultTheme.foreground,
    accentForeground: user?.themeAccentForeground ?? defaultTheme.accentForeground,
  };
}
