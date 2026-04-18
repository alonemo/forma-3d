import React, { useState } from 'react';
import { Drawer, IconButton, Button, Alert, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../ProductForm/ProductForm';
import styles from './CartDrawer.module.css';

const SHIPPING_FREE_FROM = 5000;
const SHIPPING_COST = 390;

export default function CartDrawer() {
  const { open, items, toggleDrawer, removeItem, updateQuantity, checkout } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= SHIPPING_FREE_FROM ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!user) {
      toggleDrawer(false);
      navigate('/login');
      return;
    }
    const result = await checkout();
    setSnack({ open: true, message: result.message, severity: result.success ? 'success' : 'error' });
    if (result.success) toggleDrawer(false);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => toggleDrawer(false)}
        PaperProps={{ className: styles.drawer, sx: { width: { xs: '100vw', sm: 480 } } }}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>Корзина</h2>
          <IconButton onClick={() => toggleDrawer(false)} aria-label="Закрыть корзину">
            <CloseIcon />
          </IconButton>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <h3 className={styles.emptyTitle}>Корзина пуста</h3>
              <p className={styles.emptyText}>
                Загляните в каталог — у нас работы в&nbsp;наличии.
              </p>
              <Button
                variant="outlined"
                size="small"
                onClick={() => { toggleDrawer(false); navigate('/catalog'); }}
              >
                В каталог →
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div className={styles.row} key={item.id}>
                <div className={styles.thumb}>
                  <ProductForm product={item} />
                </div>
                <div className={styles.info}>
                  <div className={styles.name}>{item.name}</div>
                  <div className={styles.meta}>
                    {item.material ? `${item.material}` : ''}
                    {item.category ? ` · ${item.category}` : ''}
                  </div>
                  <div className={styles.qtyMini}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Уменьшить"
                    >−</button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Увеличить"
                    >+</button>
                  </div>
                </div>
                <div className={styles.priceCol}>
                  <div className={styles.price}>
                    {(parseFloat(item.price) * item.quantity).toLocaleString('ru-RU')}&nbsp;₽
                  </div>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeItem(item.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.foot}>
            <div className={styles.totalRow}>
              <span>Подытог</span>
              <span className={styles.mono}>{subtotal.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className={styles.totalRow}>
              <span>Доставка</span>
              <span className={styles.mono}>
                {shipping === 0 ? 'бесплатно' : `${shipping} ₽`}
              </span>
            </div>
            <div className={`${styles.totalRow} ${styles.totalFinal}`}>
              <span>Итого</span>
              <span className={styles.totalFinalValue}>{total.toLocaleString('ru-RU')} ₽</span>
            </div>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCheckout}
              sx={{ py: 2, mt: 0 }}
            >
              Оформить заказ →
            </Button>
            <p className={styles.footNote}>
              Печать 3–7 дней · Доставка СДЭК / почтой
            </p>
          </div>
        )}
      </Drawer>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
