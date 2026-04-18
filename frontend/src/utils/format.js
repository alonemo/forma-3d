// Synthesize an SKU-like code from a product id — UI-only, not stored in DB.
export function skuFor(product) {
  const id = product?.id ?? 0;
  return `FM-${String(id).padStart(3, '0')}`;
}

// Russian pluralization helper: noun(1, ['год', 'года', 'лет']) → 'год'
export function noun(n, forms) {
  const last2 = n % 100;
  const last = n % 10;
  if (last2 >= 11 && last2 <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

// Format an order id as F-00123
export function orderIdFmt(id) {
  return `F-${String(id).padStart(5, '0')}`;
}

// Russian long-date formatter: '18 апреля 2026 г.'
export function formatDate(d) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
