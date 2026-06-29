import { useEffect, useState } from "react";

// Returns the resolved hsl() color string for a CSS variable, recomputed
// whenever the theme or accent changes so Recharts gets a concrete color.
export function useThemeColor(varName, deps = []) {
  const [color, setColor] = useState("");
  useEffect(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    setColor(v ? `hsl(${v})` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return color;
}
