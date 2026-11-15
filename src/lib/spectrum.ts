/** Wavelength (nm) to sRGB, ported from the prototype's wl(). Spectrum colours are always computed, never hard-coded. */
export function wl(nm: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  return [r, g, b].map((v) => Math.round(255 * Math.pow(v, 0.8))) as [number, number, number];
}

export function wlCss(nm: number): string {
  return `rgb(${wl(nm).join(',')})`;
}

/** The band spans 420–680 nm. Returns the left offset in percent. */
export const BAND = { min: 420, max: 680 } as const;
export function bandPercent(nm: number): number {
  return ((nm - BAND.min) / (BAND.max - BAND.min)) * 100;
}
