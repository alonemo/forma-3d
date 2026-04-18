import React from 'react';
import { Chip } from '@mui/material';
import useCartStore from '../../store/cartStore';
import FadeText from '../FadeText/FadeText';
import ProductForm from '../ProductForm/ProductForm';
import { skuFor } from '../../utils/format';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, onOpen }) {
  const { addItem, toggleDrawer } = useCartStore();
  const outOfStock = product.stock === 0;
  const lowStock = !outOfStock && product.stock <= 5;

  const handleClick = () => { if (onOpen) onOpen(product); };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product);
    toggleDrawer(true);
  };

  return (
    <div
      className={`${styles.card} ${outOfStock ? styles.soldOut : ''}`}
      onClick={handleClick}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className={styles.imageBox}>
        <div className={styles.overlay}>
          <span>{product.material || ''}</span>
          {product.category && <span className={styles.overlayRight}>{product.category}</span>}
        </div>

        <ProductForm product={product} />

        {outOfStock && (
          <Chip label="Нет в наличии" size="small" color="error" className={styles.badge} />
        )}
        {lowStock && (
          <Chip label={`Осталось: ${product.stock}`} size="small" color="warning" className={styles.badge} />
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.info}>
          <div className={styles.title}>{product.name}</div>
          <div className={styles.sku}>
            {skuFor(product)}
            {product.material ? ` · ${product.material}` : ''}
          </div>
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className={styles.colorRow} aria-label="Доступные цвета">
              {product.colors.slice(0, 5).map((hex, idx) => (
                <span key={`${hex}-${idx}`} className={styles.colorDot} style={{ background: hex }} />
              ))}
            </div>
          )}
          <div className={styles.descWrap}>
            <FadeText variant="body2" lines={2} lineHeight={1.5} className={styles.desc}
              sx={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
              {product.description}
            </FadeText>
          </div>
        </div>
        <div className={styles.priceCol}>
          <div className={`${styles.price} ${outOfStock ? styles.priceDisabled : ''}`}>
            {parseFloat(product.price).toLocaleString('ru-RU')}&nbsp;₽
          </div>
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={outOfStock}
            type="button"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}
