import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, IconButton, Badge, Button, Menu, MenuItem,
  Divider, Drawer,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import styles from './Navbar.module.css';

const navItems = [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Заказать', to: '/order' },
  { label: 'О нас',   to: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { items, toggleDrawer } = useCartStore();
  const navigate = useNavigate();

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const handler = () => {
      const next = window.scrollY > 20;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
    setMobileOpen(false);
    navigate('/');
  };

  const goUserArea = () => {
    if (user) navigate('/profile'); else navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
    >
      <Toolbar disableGutters className={styles.inner}>
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoDot} />
          <span className={styles.logoWord}>форма</span>
          <span className={styles.logoSub}>студия 3D&nbsp;печати</span>
        </NavLink>

        <Box className={styles.nav} sx={{ display: { xs: 'none', md: 'flex' } }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={styles.navLink}>
              {({ isActive }) => (
                <span className={isActive ? styles.navLinkActive : ''}>{item.label}</span>
              )}
            </NavLink>
          ))}
        </Box>

        <Box className={styles.right}>
          {user ? (
            <Button
              onClick={(e) => setAnchorEl(e.currentTarget)}
              className={styles.userBtn}
              startIcon={<PersonOutlineIcon sx={{ fontSize: 18 }} />}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              {user.name?.split(' ')[0]}
            </Button>
          ) : (
            <IconButton
              onClick={goUserArea}
              className={styles.iconBtn}
              aria-label="Войти"
              title="Войти"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <PersonOutlineIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
              Личный кабинет
            </MenuItem>
            {user?.role === 'admin' && (
              <MenuItem onClick={() => { navigate('/admin'); setAnchorEl(null); }}>
                Панель админа
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>Выйти</MenuItem>
          </Menu>

          <IconButton
            onClick={() => toggleDrawer(true)}
            className={styles.iconBtn}
            aria-label="Корзина"
          >
            <Badge badgeContent={cartCount} color="secondary" overlap="circular">
              <ShoppingCartIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          <IconButton
            onClick={() => setMobileOpen(true)}
            className={styles.iconBtn}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            aria-label="Открыть меню"
          >
            <MenuIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMobile}
        PaperProps={{ className: styles.mobileDrawer, sx: { width: 300 } }}
      >
        <div className={styles.mobileHeader}>
          <span className={styles.logo}>
            <span className={styles.logoDot} />
            <span className={styles.logoWord}>форма</span>
          </span>
          <IconButton onClick={closeMobile} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <div className={styles.mobileNav}>
          {navItems.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeMobile}
              className={styles.mobileLinkWrap}
            >
              {({ isActive }) => (
                <div className={`${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
                  <span className={styles.mobileLinkNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>

        <div className={styles.mobileFooter}>
          {user ? (
            <>
              <div className={styles.mobileAccountLabel}>Аккаунт</div>
              <div className={styles.mobileAccountName}>{user.name}</div>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => { navigate('/profile'); closeMobile(); }}
                sx={{ mb: 1 }}
              >
                Личный кабинет
              </Button>
              {user.role === 'admin' && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => { navigate('/admin'); closeMobile(); }}
                  sx={{ mb: 1 }}
                >
                  Админка
                </Button>
              )}
              <Button fullWidth variant="text" onClick={handleLogout} sx={{ color: 'var(--error)' }}>
                Выйти
              </Button>
            </>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={() => { navigate('/login'); closeMobile(); }}
            >
              Войти
            </Button>
          )}
        </div>
      </Drawer>
    </AppBar>
  );
}
