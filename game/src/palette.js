export const PALETTE = {
  canvas: '#14161a',
  surface: '#1e2228',
  hairline: '#2c323a',
  ink: '#e9e6df',
  muted: '#98a0a8',
  accent: '#f0a830',
  teamA: '#388bfd',
  teamB: '#f85149',
};

export function shade(name) {
  return PALETTE[name];
}
