import React from 'react';
import { mediaUrl } from '../../utils/mediaUrl';
import styles from './ProductForm.module.css';

const TERRACOTTA = '#b85c3c';
const OCHRE      = '#c8893b';
const FOREST     = '#3d5a40';
const CHARCOAL   = '#2b2118';
const SAND       = '#bfa888';
const OLIVE      = '#8a7a3f';

const PALETTE = [TERRACOTTA, OCHRE, OLIVE, SAND, CHARCOAL, FOREST];

export const PRODUCT_PALETTE = PALETTE;

// Stable silhouette color for a product — shared with filter UI
export function pickProductColor(product) {
  const id = product?.id ?? 0;
  const n = typeof id === 'number' ? id : String(id).charCodeAt(0) || 0;
  return PALETTE[Math.abs(n) % PALETTE.length];
}

// Map Russian category strings to geometric archetypes used by the silhouette
const CATEGORY_KIND = {
  'Декор':       'decor',
  'Фигурки':     'figures',
  'Светильники': 'lamp',
  'Игрушки':     'toys',
  'Органайзеры': 'organizers',
  'Кухня':       'organizers',
  'Гаджеты':     'organizers',
};

const pickColor = pickProductColor;

function kindFor(product) {
  return CATEGORY_KIND[product?.category] || 'decor';
}

function Silhouette({ product, colorOverride }) {
  const firstReal = Array.isArray(product?.colors) && product.colors.length > 0 ? product.colors[0] : null;
  const color = colorOverride || firstReal || pickColor(product);
  const kind = kindFor(product);

  if (kind === 'figures') {
    return (
      <>
        <div className={styles.layers} />
        <div className={styles.figureWrap}>
          <div className={styles.figureBase} style={{ background: color }} />
          <div className={styles.figureBody} style={{ background: color }} />
          <div className={styles.figureHead} style={{ background: color }} />
        </div>
      </>
    );
  }

  if (kind === 'organizers') {
    return (
      <>
        <div className={styles.layers} />
        <div className={styles.organizerGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.organizerCell} style={{ background: color, opacity: 0.92 + (i % 2) * 0.08 }} />
          ))}
        </div>
      </>
    );
  }

  if (kind === 'toys') {
    return (
      <>
        <div className={styles.layers} />
        <div className={styles.toyDisk} style={{ background: color, boxShadow: `inset 0 0 0 12px rgba(0,0,0,0.08), 0 0 0 8px ${color}33` }}>
          <div className={styles.toyRing} style={{ borderColor: color }} />
        </div>
      </>
    );
  }

  // decor / lamps / default — stacked vase layers
  const layers = 32;
  const isLamp = kind === 'lamp';
  return (
    <>
      <div className={styles.layers} />
      <div className={styles.vase}>
        {Array.from({ length: layers }).map((_, i) => {
          const t = i / (layers - 1);
          const curve = isLamp
            ? Math.sin(t * Math.PI) * 0.5 + 0.5
            : Math.sin(t * Math.PI * 0.7) * 0.4 + 0.6;
          const w = 40 + curve * 55;
          return (
            <div
              key={i}
              className={styles.vaseLayer}
              style={{ width: `${w}%`, background: color }}
            />
          );
        })}
      </div>
    </>
  );
}

// Usage: <ProductForm product={p} /> inside a positioned parent (typically .card-image-like box)
export default function ProductForm({ product, colorOverride }) {
  const hasPhoto = Boolean(product?.image_url);

  return (
    <div className={styles.root}>
      {hasPhoto ? (
        <img src={mediaUrl(product.image_url)} alt={product.name || ''} className={styles.photo} />
      ) : (
        <Silhouette product={product} colorOverride={colorOverride} />
      )}
    </div>
  );
}
