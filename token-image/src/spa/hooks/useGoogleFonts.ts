import { useEffect } from "react";

export function useGoogleFonts(tokens: Record<string, any>) {
  const fontFamilyKey = JSON.stringify(tokens.fontFamily);
  const fontWeightKey = JSON.stringify(tokens.fontWeight);

  useEffect(() => {
    const families = tokens.fontFamily;
    const weights = tokens.fontWeight;
    if (!families || !weights) return;
    const familyValues = [...new Set(Object.values(families) as string[])];
    const weightValues = Object.values(weights) as number[];
    if (familyValues.length === 0 || weightValues.length === 0) return;
    const weightStr = weightValues.join(";");
    const familyParams = familyValues
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@${weightStr}`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
    let link = document.getElementById("google-fonts") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "google-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.href = href;
    }
  }, [fontFamilyKey, fontWeightKey]);
}
