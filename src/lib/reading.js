export const THRESHOLDS = [25, 50, 75, 90];

export function depth(top, bottom, viewport) {
  return ((viewport - top) / (bottom - top)) * 100;
}

export function crossed(percent, sent) {
  const fresh = THRESHOLDS.filter((t) => percent >= t && !sent.has(t));
  for (const t of fresh) sent.add(t);
  return fresh;
}
