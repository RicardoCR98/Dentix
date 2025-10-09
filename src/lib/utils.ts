export const toInt = (v: unknown) => {
  const n = Math.round(parseFloat(String(v)) || 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};
