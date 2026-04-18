export interface Tokens {
  color: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    textDisplay: string;
    accent: string;
  };
  fontFamily: {
    display: string;
    body: string;
    mono: string;
  };
  fontSize: {
    hero: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    body: string;
    small: string;
  };
  fontWeight: {
    normal: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  opacity: {
    muted: string;
    subtle: string;
  };
}
