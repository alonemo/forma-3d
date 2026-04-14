import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, IconButton, Badge, Button, Avatar, Menu, MenuItem,
  Divider, Tooltip, Drawer, List, ListItem, ListItemButton, ListItemText, Typography,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PrintIcon from '@mui/icons-material/Print';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import styles from './Navbar.module.css';

const navItems = [
  { label: 'Главная', to: '/' },
  { label: 'О нас', to: '/about' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Заказать', to: '/order' },
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
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
    setMobileOpen(false);
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}
      sx={{ background: 'transparent' }}
    >
      <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
        <NavLink to="/" className={styles.logo} style={{ color: '#e8e8f0' }}>
          <PrintIcon sx={{ color: '#00e5ff', fontSize: 26 }} />
          <span>Print<span className={styles.logoAccent}>3D</span></span>
        </NavLink>

        <Box sx={{ flex: 1 }} />

        {/* Desktop nav links */}
        <Box className={styles.navLinks} sx={{ display: { xs: 'none', md: 'flex' } }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {({ isActive }) => (
                <Button className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
                  {item.label}
                </Button>
              )}
            </NavLink>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, ml: { xs: 0, md: 2 } }}>
          <Tooltip title="Корзина">
            <IconButton onClick={() => toggleDrawer(true)} sx={{ color: '#9090a8', '&:hover': { color: '#00e5ff' } }}>
              <Badge badgeContent={cartCount} color="primary" className={cartCount > 0 ? styles.cartBadge : ''}>
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Desktop: login button + avatar */}
          {user ? (
            <>
              <Tooltip title={user.name}>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5, display: { xs: 'none', md: 'flex' } }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: '#0a0a0f', fontSize: 14, fontWeight: 700 }}>
                    {user.name?.[0]?.toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { mt: 1, minWidth: 180 } }}
              >
                <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
                  <AccountCircleIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
                  Личный кабинет
                </MenuItem>
                {user.role === 'admin' && (
                  <MenuItem onClick={() => { navigate('/admin'); setAnchorEl(null); }}>
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1.5, color: 'warning.main' }} />
                    Панель админа
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} />
                  Выйти
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/login')}
              sx={{ display: { xs: 'none', md: 'flex' }, borderColor: 'rgba(0,229,255,0.4)', color: '#00e5ff', '&:hover': { borderColor: '#00e5ff', background: 'rgba(0,229,255,0.08)' } }}
            >
              Войти
            </Button>
          )}

          {/* Mobile hamburger */}
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'flex', md: 'none' }, color: '#9090a8', '&:hover': { color: '#e8e8f0' } }}
            aria-label="Открыть меню"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMobile}
        PaperProps={{ sx: { width: 270, background: '#0d0d16', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column' } }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrintIcon sx={{ color: '#00e5ff', fontSize: 22 }} />
            <Typography fontWeight={800} fontSize="1.1rem" color="#e8e8f0">
              Print<Box component="span" sx={{ color: '#00e5ff' }}>3D</Box>
            </Typography>
          </Box>
          <IconButton onClick={closeMobile} size="small" sx={{ color: '#9090a8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Nav links */}
        <List sx={{ pt: 1, flex: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.to} disablePadding>
              <NavLink to={item.to} end={item.to === '/'} style={{ width: '100%', textDecoration: 'none' }}>
                {({ isActive }) => (
                  <ListItemButton
                    onClick={closeMobile}
                    sx={{
                      py: 1.5, px: 3,
                      color: isActive ? '#00e5ff' : '#9090a8',
                      background: isActive ? 'rgba(0,229,255,0.06)' : 'transparent',
                      borderLeft: `3px solid ${isActive ? '#00e5ff' : 'transparent'}`,
                      '&:hover': { color: '#e8e8f0', background: 'rgba(255,255,255,0.04)', borderLeftColor: 'rgba(255,255,255,0.2)' },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontWeight: isActive ? 700 : 400, fontSize: '0.95rem' }}
                    />
                  </ListItemButton>
                )}
              </NavLink>
            </ListItem>
          ))}
        </List>

        {/* Auth section at bottom */}
        <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {user ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: 'primary.main', color: '#0a0a0f', fontSize: 15, fontWeight: 700 }}>
                  {user.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} color="#e8e8f0" noWrap>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">{user.email}</Typography>
                </Box>
              </Box>
              <Button fullWidth variant="outlined" size="small" onClick={() => { navigate('/profile'); closeMobile(); }}
                sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.15)', color: '#e8e8f0', '&:hover': { borderColor: '#00e5ff', color: '#00e5ff' } }}>
                Личный кабинет
              </Button>
              {user.role === 'admin' && (
                <Button fullWidth variant="outlined" color="warning" size="small"
                  onClick={() => { navigate('/admin'); closeMobile(); }} sx={{ mb: 1 }}>
                  Панель админа
                </Button>
              )}
              <Button fullWidth variant="text" color="error" size="small" onClick={handleLogout}>
                Выйти
              </Button>
            </>
          ) : (
            <Button fullWidth variant="contained" onClick={() => { navigate('/login'); closeMobile(); }}>
              Войти
            </Button>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
}
