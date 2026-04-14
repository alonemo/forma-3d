import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Grid, Divider } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={4}>
            <Link to="/" className={styles.logo}>
              <PrintIcon sx={{ color: '#00e5ff' }} />
              Print<span className={styles.logoAccent}>3D</span>
            </Link>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
              Воплощаем ваши идеи в жизнь с помощью современных технологий 3D-печати.
              Качество, скорость, точность.
            </Typography>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Навигация
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[['/', 'Главная'], ['/about', 'О нас'], ['/catalog', 'Каталог'], ['/order', 'Заказать']].map(([to, label]) => (
                <Link key={to} to={to} className={styles.link}>{label}</Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Контакты
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">📞 +7 (495) 123-45-67</Typography>
              <Typography variant="body2" color="text.secondary">✉️ info@print3d.ru</Typography>
              <Typography variant="body2" color="text.secondary">📍 Москва, ул. Технологическая, 15</Typography>
              <Typography variant="body2" color="text.secondary">⏰ Пн–Пт: 9:00–18:00</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Материалы
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {['PLA — экологичный пластик', 'PETG — прочный и гибкий', 'ABS — термостойкий', 'Resin — фотополимер'].map((m) => (
                <Typography key={m} variant="body2" color="text.secondary">{m}</Typography>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider className={styles.divider} />
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          © {new Date().getFullYear()} Print3D. Все права защищены.
        </Typography>
      </Container>
    </footer>
  );
}
