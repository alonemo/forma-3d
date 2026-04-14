import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box, Tooltip } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import useCartStore from '../../store/cartStore';
import FadeText from '../FadeText/FadeText';
import { mediaUrl } from '../../utils/mediaUrl';
import styles from './ProductCard.module.css';

const CATEGORY_EMOJI = {
  'Органайзеры': '🗂️', 'Подставки': '🖥️', 'Декор': '🏺', 'Автотовары': '🚗',
  'Аксессуары': '🔑', 'Электроника': '⚡', 'Фигурки': '🐉', 'default': '🖨️',
};

const MATERIAL_COLOR = {
  PLA: '#00e5ff', PETG: '#7c4dff', ABS: '#ff6d00', Resin: '#e040fb',
};

export default function ProductCard({ product }) {
  const { addItem, toggleDrawer } = useCartStore();
  const emoji = CATEGORY_EMOJI[product.category] || CATEGORY_EMOJI.default;
  const outOfStock = product.stock === 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product);
    toggleDrawer(true);
  };

  return (
    <Card className={`${styles.card} ${outOfStock ? styles.soldOut : ''}`}>
      <Box className={styles.imageBox}>
        {product.image_url
          ? <img src={mediaUrl(product.image_url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span>{emoji}</span>
        }
        {outOfStock && (
          <Chip label="Нет в наличии" size="small" color="error" className={styles.badge} />
        )}
        {!outOfStock && product.stock <= 5 && (
          <Chip label={`Осталось: ${product.stock}`} size="small" color="warning" className={styles.badge} />
        )}
      </Box>

      <CardContent sx={{ flex: 1, pb: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
          {product.category && (
            <Chip label={product.category} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
          )}
          {product.material && (
            <Chip
              label={product.material}
              size="small"
              sx={{ fontSize: '0.7rem', height: 20, borderColor: MATERIAL_COLOR[product.material] || '#fff', color: MATERIAL_COLOR[product.material] || '#fff' }}
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body1" fontWeight={600} className={styles.name}>{product.name}</Typography>
        <div className={styles.descWrap}>
          <FadeText variant="body2" color="text.secondary" lines={2} lineHeight={1.5}>
            {product.description}
          </FadeText>
        </div>
        <Typography variant="h6" color={outOfStock ? 'text.disabled' : 'primary.main'} fontWeight={700} sx={{ mt: 1.5 }}>
          {parseFloat(product.price).toLocaleString('ru-RU')} ₽
        </Typography>
        {outOfStock && (
          <Typography variant="caption" sx={{ color: '#ff5252', display: 'block', mt: 0.5, fontWeight: 600 }}>
            Товара пока нет в наличии
          </Typography>
        )}
      </CardContent>

      <CardActions className={styles.actions}>
        <Tooltip title={outOfStock ? 'Нет в наличии' : 'Добавить в корзину'}>
          <span style={{ flex: 1 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddShoppingCartIcon />}
              onClick={handleAdd}
              disabled={outOfStock}
              size="small"
            >
              В корзину
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
