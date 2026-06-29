// All weights are stored internally in KILOGRAMS. These helpers convert
// to/from the user's preferred display unit.

export const KG_PER_LB = 0.45359237;

export function kgToLbs(kg) {
  return kg / KG_PER_LB;
}

export function lbsToKg(lbs) {
  return lbs * KG_PER_LB;
}

// Convert a stored kg value to the display unit number.
export function toDisplay(kg, unit) {
  if (kg == null || isNaN(kg)) return null;
  return unit === "lbs" ? kgToLbs(kg) : kg;
}

// Convert a number typed by the user (in their unit) back to kg for storage.
export function fromDisplay(value, unit) {
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return unit === "lbs" ? lbsToKg(n) : n;
}

// Pretty string e.g. "72.4 kg"
export function formatWeight(kg, unit, digits = 1) {
  const d = toDisplay(kg, unit);
  if (d == null) return "—";
  return `${d.toFixed(digits)} ${unit}`;
}

export function unitLabel(unit) {
  return unit === "lbs" ? "lbs" : "kg";
}
