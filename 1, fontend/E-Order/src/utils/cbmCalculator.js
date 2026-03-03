const CBM_DIVISOR = 1_000_000_000;
const PRECISION_MULTIPLIER = 10000000000; // 10 decimal places for calculation

// =============================================
// INTERNAL: High-precision flavour CBM (used by container/truck calculations)
// =============================================
function calculateFlavourCBMPrecise(flavour, details) {
  if (!details || flavour.sku === "-1") return 0;

  const qty = Number(flavour.qty || 0);

  const volume =
    (details.ctn_height + 1) *
    (details.ctn_length + 1) *
    (details.ctn_width + 1);

  const cbm = (qty * volume) / CBM_DIVISOR;

  // 10 decimal precision for accurate comparison
  return Math.floor(cbm * PRECISION_MULTIPLIER) / PRECISION_MULTIPLIER;
}

// =============================================
// CALCULATION FUNCTIONS (high precision for comparison)
// =============================================
export function calculateFlavourCBM(flavour, details) {
  return calculateFlavourCBMPrecise(flavour, details);
}

export function calculateFlavourUnitCBM(details) {
  if (!details) return 0;
  const volume =
    (details.ctn_height + 1) *
    (details.ctn_length + 1) *
    (details.ctn_width + 1);
  return volume / CBM_DIVISOR;
}

export function calculateContainerCBM(container, flavourLookup) {
  if (!container?.Flavour) return 0;

  let total = 0;
  container.Flavour.forEach(f => {
    total += calculateFlavourCBMPrecise(f, flavourLookup[f.sku]);
  });

  // 10 decimal precision for accurate comparison
  return Math.floor(total * PRECISION_MULTIPLIER) / PRECISION_MULTIPLIER;
}

export function calculateTruckCBM(order, flavourLookup) {
  if (!order?.flavors) return 0;

  let total = 0;
  order.flavors.forEach(f => {
    total += calculateFlavourCBMPrecise(f, flavourLookup[f.sku]);
  });

  // 10 decimal precision for accurate comparison
  return Math.floor(total * PRECISION_MULTIPLIER) / PRECISION_MULTIPLIER;
}

// =============================================
// DISPLAY FUNCTION (1 decimal for user-friendly UI)
// =============================================
export function formatCBMForDisplay(cbmValue) {
  return Math.floor(cbmValue * 10) / 10;
}




