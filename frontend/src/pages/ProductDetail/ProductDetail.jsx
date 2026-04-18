import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Skeleton, Chip } from '@mui/material';
import { getProductApi } from '../../api/products';
import useCartStore from '../../store/cartStore';
import ProductForm from '../../components/ProductForm/ProductForm';
import { skuFor } from '../../utils/format';
import styles from './ProductDetail.module.css';

// Synthesize layer count + print time from price — purely decorative, gives the
// "materials-first" feel the design asks for even though the DB doesn't store this.
function specsFor(product) {
  const p = parseFloat(product?.price) || 0;
  const layers = Math.max(200, Math.round((p / 2.5)));
  const minutes = Math.max(90, Math.round(layers * 0.35));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return { layers, time: `${h} ч ${String(m).padStart(2, '0')} мин` };
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, toggleDrawer } = useCartStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [activeColor, setActiveColor] = useState(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getProductApi(id)
      .then((r) => {
        setProduct(r.data);
        setActiveColor(Array.isArray(r.data.colors) && r.data.colors.length > 0 ? r.data.colors[0] : null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.crumbs}>
          <span>Главная / Каталог / …</span>
        </div>
        <div className={styles.layout}>
          <Skeleton variant="rectangular" height={540} sx={{ borderRadius: '4px' }} />
          <div>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="70%" height={60} />
            <Skeleton variant="text" width="30%" height={40} sx={{ mt: 3 }} />
            <Skeleton variant="rectangular" height={160} sx={{ mt: 3 }} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Товар не найден.</h2>
          <p>Возможно, его сняли с производства или ссылка устарела.</p>
          <Button variant="outlined" onClick={() => navigate('/catalog')} sx={{ mt: 2 }}>
            ← В каталог
          </Button>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock === 0;
  const specs = specsFor(product);

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(product, qty);
    toggleDrawer(true);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.crumbs} aria-label="breadcrumbs">
        <button type="button" onClick={() => navigate('/')} className={styles.crumbLink}>Главная</button>
        <span className={styles.crumbSep}>/</span>
        <button type="button" onClick={() => navigate('/catalog')} className={styles.crumbLink}>Каталог</button>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>{product.name}</span>
      </nav>

      <div className={styles.layout}>
        {/* ─────── Gallery ─────── */}
        <div className={styles.gallery}>
          <div className={styles.galleryMain}>
            <div className={styles.galleryOverlay}>
              <span>{product.material || ''}{product.category ? ` · ${product.category}` : ''}</span>
              <span>Ручная обработка</span>
            </div>
            <ProductForm product={product} colorOverride={activeColor} />
            {outOfStock && (
              <Chip label="Нет в наличии" size="small" color="error" className={styles.badge} />
            )}
          </div>
          <div className={styles.thumbs}>
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveThumb(i)}
                className={`${styles.thumb} ${activeThumb === i ? styles.thumbActive : ''}`}
                aria-label={`Превью ${i + 1}`}
              >
                <ProductForm product={product} colorOverride={activeColor} />
              </button>
            ))}
          </div>
        </div>

        {/* ─────── Info ─────── */}
        <div className={styles.info}>
          <div className={styles.sku}>
            {skuFor(product)}
            {product.category ? ` · ${product.category}` : ''}
          </div>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.price}>
            {parseFloat(product.price).toLocaleString('ru-RU')} ₽
          </div>
          <p className={styles.description}>{product.description}</p>

          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className={styles.colorsBlock}>
              <div className={styles.colorsLabel}>Цвет</div>
              <div className={styles.colorsRow}>
                {product.colors.map((hex, idx) => {
                  const active = activeColor && activeColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={`${hex}-${idx}`}
                      type="button"
                      onClick={() => setActiveColor(hex)}
                      aria-pressed={active}
                      aria-label={`Цвет ${hex}`}
                      className={`${styles.colorBtn} ${active ? styles.colorBtnActive : ''}`}
                      style={{ background: hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.specs}>
            {product.material && (
              <div className={styles.specsRow}>
                <span className={styles.specsKey}>Материал</span>
                <span>{product.material}</span>
              </div>
            )}
            {product.category && (
              <div className={styles.specsRow}>
                <span className={styles.specsKey}>Категория</span>
                <span>{product.category}</span>
              </div>
            )}
            <div className={styles.specsRow}>
              <span className={styles.specsKey}>Слоёв печати</span>
              <span className={styles.mono}>~{specs.layers}</span>
            </div>
            <div className={styles.specsRow}>
              <span className={styles.specsKey}>Время печати</span>
              <span className={styles.mono}>~{specs.time}</span>
            </div>
            <div className={styles.specsRow}>
              <span className={styles.specsKey}>Срок изготовления</span>
              <span>3–7 дней</span>
            </div>
            <div className={styles.specsRow}>
              <span className={styles.specsKey}>В наличии</span>
              <span className={styles.mono}>
                {outOfStock ? '0 шт.' : `${product.stock} шт.`}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <div className={styles.qty}>
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                aria-label="Меньше"
              >−</button>
              <span className={styles.qtyValue}>{qty}</span>
              <button
                type="button"
                onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                aria-label="Больше"
                disabled={qty >= (product.stock || 99)}
              >+</button>
            </div>
            <Button
              variant="contained"
              size="large"
              onClick={handleAdd}
              disabled={outOfStock}
              sx={{ flex: 1 }}
            >
              {outOfStock
                ? 'Нет в наличии'
                : `В корзину — ${(parseFloat(product.price) * qty).toLocaleString('ru-RU')} ₽`}
            </Button>
          </div>

          <p className={styles.footnote}>
            ★ Бесплатная доставка по РФ от&nbsp;5&nbsp;000&nbsp;₽
          </p>
        </div>
      </div>
    </div>
  );
}
