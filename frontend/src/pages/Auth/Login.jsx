import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField, Button, Box, Alert, InputAdornment, IconButton,
} from '@mui/material';
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
      <aside className={styles.left}>
        <Link to="/" className={styles.brand}>
          print3d<span className={styles.brandAccent}>.</span>
        </Link>

        <div className={styles.quote}>
          Объёмная <span className={styles.quoteItalic}>материя</span><br />
          по запросу.
        </div>

        <div className={styles.leftMeta}>
          <span>Студия 3D-печати · Москва · С 2019</span>
          <span>00 / 01</span>
        </div>
      </aside>

      <main className={styles.right}>
        <div className={styles.topRight}>
          Нет аккаунта? <Link to="/register">Регистрация →</Link>
        </div>

        <div className={styles.formWrap}>
          <div className={styles.formNum}>01 / Вход</div>
          <h1 className={styles.formTitle}>Добро пожаловать</h1>
          <p className={styles.formSub}>
            Войдите в аккаунт Print3D, чтобы оформлять заказы и&nbsp;отслеживать их статус.
          </p>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} className={styles.form}>
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
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{ mt: 1 }}
            >
              {loading ? 'Вход…' : 'Войти →'}
            </Button>
          </Box>

          <div className={styles.divider}>или</div>

          <div className={styles.switcher}>
            Нет аккаунта?{' '}
            <Link to="/register">Зарегистрироваться</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
