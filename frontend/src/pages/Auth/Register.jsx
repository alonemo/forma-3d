import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box, Alert, InputAdornment, IconButton } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import useAuthStore from '../../store/authStore';
import styles from './Auth.module.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await register(form.name, form.email, form.password);
    if (ok) navigate('/profile');
  };

  return (
    <div className={styles.page}>
      <Container maxWidth="xs">
        <div className={styles.card}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <PrintIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>Создать аккаунт</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Присоединяйтесь к Print3D</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Имя" fullWidth value={form.name} onChange={set('name')} required autoComplete="name" />
            <TextField label="Email" type="email" fullWidth value={form.email} onChange={set('email')} required autoComplete="email" />
            <TextField
              label="Пароль"
              type={showPwd ? 'text' : 'password'}
              fullWidth
              value={form.password}
              onChange={set('password')}
              required
              helperText="Минимум 6 символов"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd(!showPwd)} edge="end">
                      {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth sx={{ mt: 1 }}>
              {loading ? 'Регистрация...' : 'Создать аккаунт'}
            </Button>
          </Box>

          <div className={styles.divider}>или</div>

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: '#00e5ff', fontWeight: 600 }}>Войти</Link>
          </Typography>
        </div>
      </Container>
    </div>
  );
}
