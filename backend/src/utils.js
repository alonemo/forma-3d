'use strict';

/**
 * node:sqlite may return Uint8Array instead of string for TEXT columns in some
 * edge cases (encoding mismatch, BLOB affinity). This helper normalises the value.
 */
const toStr = (v) => {
  if (v == null) return null;
  if (v instanceof Uint8Array) return Buffer.from(v).toString('utf-8');
  return String(v);
};

module.exports = { toStr };
