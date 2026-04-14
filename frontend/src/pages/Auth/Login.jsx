import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box, Alert, InputAdornment, IconButton } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import useAuthStore from '../../store/authStore';
import styles from './Auth.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await login(email, password);
    if (ok) navigate('/profile');
  };

  return (
    <div className={styles.page}>
      <Container maxWidth="xs">
        <div className={styles.card}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <PrintIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>Добро пожаловать</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Войдите в свой аккаунт Print3D</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <TextField
              label="Пароль"
              type={showPwd ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </Box>

          <div className={styles.divider}>или</div>

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: '#00e5ff', fontWeight: 600 }}>Зарегистрироваться</Link>
          </Typography>
        </div>
      </Container>
    </div>
  );
}
