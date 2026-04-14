import React, { useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, Button, Stack, Alert, Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { open, items, toggleDrawer, removeItem, updateQuantity, checkout } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const total = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

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
        PaperProps={{ sx: { width: { xs: '100vw', sm: 400 }, background: '#12121a', display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>Корзина</Typography>
          <IconButton onClick={() => toggleDrawer(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <ShoppingCartIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
              <Typography>Корзина пуста</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 1.5, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    🖨️
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{item.name}</Typography>
                    <Typography variant="caption" color="primary.main">{parseFloat(item.price).toLocaleString('ru-RU')} ₽</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)} sx={{ p: 0.25 }}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)} sx={{ p: 0.25 }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={700}>{(parseFloat(item.price) * item.quantity).toLocaleString('ru-RU')} ₽</Typography>
                    <IconButton size="small" onClick={() => removeItem(item.id)} sx={{ color: 'error.main', p: 0.25 }}>
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {items.length > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography color="text.secondary">Итого:</Typography>
              <Typography fontWeight={700} fontSize="1.1rem">{total.toLocaleString('ru-RU')} ₽</Typography>
            </Box>
            <Button variant="contained" fullWidth size="large" onClick={handleCheckout}>
              Оформить заказ
            </Button>
          </Box>
        )}
      </Drawer>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}
