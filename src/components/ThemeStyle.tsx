import type { Palette } from "@/lib/theme";

/** Injects the resolved per-user (or default) palette as :root CSS variables. */
export function ThemeStyle({ palette }: { palette: Palette }) {
  const css = `:root {
  --bg: ${palette.background};
  --accent-bg: ${palette.accent};
  --fg: ${palette.foreground};
  --accent-fg: ${palette.accentForeground};
}`;
  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
