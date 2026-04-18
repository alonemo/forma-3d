import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField, Button, Box, Alert, InputAdornment, IconButton,
} from '@mui/material';
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
      <aside className={styles.left}>
        <Link to="/" className={styles.brand}>
          print3d<span className={styles.brandAccent}>.</span>
        </Link>

        <div className={styles.quote}>
          Присоединяйтесь<br />
          к <span className={styles.quoteItalic}>студии</span>.
        </div>

        <div className={styles.leftMeta}>
          <span>Студия 3D-печати · Москва · С 2019</span>
          <span>00 / 02</span>
        </div>
      </aside>

      <main className={styles.right}>
        <div className={styles.topRight}>
          Уже есть аккаунт? <Link to="/login">Войти →</Link>
        </div>

        <div className={styles.formWrap}>
          <div className={styles.formNum}>02 / Регистрация</div>
          <h1 className={styles.formTitle}>Создать аккаунт</h1>
          <p className={styles.formSub}>
            Регистрация занимает минуту. Вы получите доступ к&nbsp;истории заказов
            и&nbsp;отслеживанию статусов.
          </p>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} className={styles.form}>
            <TextField
              label="Имя"
              fullWidth
              value={form.name}
              onChange={set('name')}
              required
              autoComplete="name"
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
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
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{ mt: 1 }}
            >
              {loading ? 'Регистрация…' : 'Создать аккаунт →'}
            </Button>
          </Box>

          <div className={styles.divider}>или</div>

          <div className={styles.switcher}>
            Уже есть аккаунт?{' '}
            <Link to="/login">Войти</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
