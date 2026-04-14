import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Typography, Box, Avatar, Chip, Button, Divider, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import BuildIcon from '@mui/icons-material/Build';
import useAuthStore from '../../store/authStore';
import useOrderStore from '../../store/orderStore';
import FadeText from '../../components/FadeText/FadeText';
import styles from './Profile.module.css';

const STATUS_MAP = {
  created:     { label: 'Создан',     color: 'default' },
  in_progress: { label: 'В процессе', color: 'warning' },
  ready:       { label: 'Готово',      color: 'success' },
  cancelled:   { label: 'Отменён',     color: 'error' },
};

const TYPE_MAP = {
  catalog: { label: 'Из каталога',    icon: <ShoppingBagIcon sx={{ fontSize: 14 }} /> },
  custom:  { label: 'Индивидуальный', icon: <BuildIcon sx={{ fontSize: 14 }} /> },
};

export default function Profile() {
  const { user } = useAuthStore();
  const { orders, fetchUserOrders, cancelUserOrder, loading } = useOrderStore();
  const navigate = useNavigate();

  const [confirmCancel, setConfirmCancel] = useState(null); // orderId or null

  useEffect(() => { fetchUserOrders(); }, []);

  if (!user) return null;

  const handleCancel = async () => {
    if (!confirmCancel) return;
    await cancelUserOrder(confirmCancel);
    setConfirmCancel(null);
  };

  return (
    <div>
      <section className={styles.hero}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', color: '#0a0a0f', fontSize: '2rem', fontWeight: 700 }}>
              {user.name?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <Typography variant="h4" fontWeight={700}>{user.name}</Typography>
              <Typography color="text.secondary">{user.email}</Typography>
              {user.role === 'admin' && (
                <Chip label="Администратор" size="small" color="warning" sx={{ mt: 0.5, fontWeight: 600 }} />
              )}
            </div>
          </Box>
        </Container>
      </section>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Мои заказы</Typography>

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={120} sx={{ borderRadius: 2, mb: 2 }} />)
            ) : orders.length === 0 ? (
              <div className={styles.empty}>
                <Typography variant="h2" sx={{ mb: 1 }}>📦</Typography>
                <Typography variant="h6" gutterBottom>Заказов пока нет</Typography>
                <Button variant="contained" onClick={() => navigate('/catalog')} sx={{ mt: 1 }}>Перейти в каталог</Button>
              </div>
            ) : (
              orders.map((order) => {
                const st = STATUS_MAP[order.status] || { label: order.status, color: 'default' };
                const tp = TYPE_MAP[order.type] || { label: order.type };
                return (
                  <div key={order.id} className={styles.orderCard}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography fontWeight={700}>Заказ #{order.id}</Typography>
                        <Chip icon={tp.icon} label={tp.label} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={st.label} size="small" color={st.color} className={styles.statusChip} />
                        {order.status === 'created' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', py: 0.25, px: 1, minWidth: 0 }}
                            onClick={() => setConfirmCancel(order.id)}
                          >
                            Отменить
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {order.type === 'catalog' && order.items?.map((item) => (
                      <Typography key={item.name} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        • {item.name} × {item.quantity} — {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                      </Typography>
                    ))}

                    {order.type === 'custom' && order.custom_detail && (
                      <FadeText variant="body2" color="text.secondary" lines={3}>
                        {order.custom_detail.description}
                      </FadeText>
                    )}

                    {order.status === 'cancelled' && order.cancel_reason && (
                      <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                        Причина отмены: {order.cancel_reason}
                      </Typography>
                    )}

                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Typography>
                      {order.total_price && (
                        <Typography fontWeight={700} color="primary.main">
                          {parseFloat(order.total_price).toLocaleString('ru-RU')} ₽
                        </Typography>
                      )}
                    </Box>
                  </div>
                );
              })
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Typography fontWeight={700} gutterBottom>Быстрые действия</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                <Button variant="contained" fullWidth onClick={() => navigate('/order')}>Новый заказ</Button>
                <Button variant="outlined" fullWidth onClick={() => navigate('/catalog')}
                  sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#e8e8f0', '&:hover': { borderColor: '#00e5ff', color: '#00e5ff' } }}>
                  Каталог товаров
                </Button>
                {user.role === 'admin' && (
                  <Button variant="outlined" color="warning" fullWidth onClick={() => navigate('/admin')}>
                    Панель администратора
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Cancel confirmation */}
      <Dialog open={!!confirmCancel} onClose={() => setConfirmCancel(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { background: '#12121a' } }}>
        <DialogTitle fontWeight={700}>Отменить заказ #{confirmCancel}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Заказ будет отменён. Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setConfirmCancel(null)}>Нет, оставить</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>Да, отменить</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
