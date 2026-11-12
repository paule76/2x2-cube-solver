// Turns language-neutral results from cube.js into translated text.

/**
 * @param {{ code: string, params?: object }} result failed parseFacelets result
 * @param {(key: string, params?: object) => string} t
 */
export function formatParseError({ code, params = {} }, t) {
  const colorName = (c) => t(`color.${c}`);
  const p = { ...params };
  if (p.color) p.color = colorName(p.color);
  if (p.colors) p.colors = p.colors.map(colorName).join('/');
  if (p.position) p.corner = t(`corner.${p.position}`);
  return t(`error.${code}`, p);
}
