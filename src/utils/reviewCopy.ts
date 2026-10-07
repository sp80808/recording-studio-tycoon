/** Review copy helpers: readable skill names and a single pair of quote marks. */

export const humanizeSkill = (key: string): string =>
  key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

/** Wrap press copy in curly quotes only when it does not already open with a quote. */
export const pressQuote = (text: string): string => {
  const t = text.trim();
  return /^["“'‘]/.test(t) ? t : `“${t}”`;
};
