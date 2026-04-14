import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import CartDrawer from './components/CartDrawer/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader/PageLoader';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Catalog from './pages/Catalog/Catalog';
import Order from './pages/Order/Order';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import useAuthStore from './store/authStore';

const AUTH_ROUTES = ['/login', '/register'];

export default function App() {
  const { fetchMe } = useAuthStore();
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => { fetchMe(); }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PageLoader />
      {!isAuthPage && <Navbar />}
      <Box sx={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/order" element={<Order />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        </Routes>
      </Box>
      {!isAuthPage && <Footer />}
      <CartDrawer />
    </Box>
  );
}
