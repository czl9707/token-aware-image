import { useEffect } from "react";

const GOOGLE_FONTS_WEIGHTS = "100;200;300;400;500;600;700;800;900";

export function useGoogleFonts(tokens: Record<string, any>) {
  const fontFamilyKey = JSON.stringify(tokens.fontFamily);

  useEffect(() => {
    const families = tokens.fontFamily;
    if (!families) return;
    const familyValues = [...new Set(Object.values(families) as string[])];
    if (familyValues.length === 0) return;
    const familyParams = familyValues
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@${GOOGLE_FONTS_WEIGHTS}`)
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
  }, [fontFamilyKey]);
}
