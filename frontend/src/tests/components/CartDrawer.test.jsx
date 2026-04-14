import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import theme from '../../theme';
import CartDrawer from '../../components/CartDrawer/CartDrawer';

const mockToggleDrawer = vi.fn();
const mockRemoveItem = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockCheckout = vi.fn();

let mockState = { open: true, items: [], toggleDrawer: mockToggleDrawer, removeItem: mockRemoveItem, updateQuantity: mockUpdateQuantity, checkout: mockCheckout };

vi.mock('../../store/cartStore', () => ({ default: () => mockState }));
vi.mock('../../store/authStore', () => ({ default: () => ({ user: { id: 1, name: 'Иван' } }) }));

const renderDrawer = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <CartDrawer />
      </ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  mockToggleDrawer.mockClear();
  mockRemoveItem.mockClear();
  mockCheckout.mockClear();
});

describe('CartDrawer: пустая корзина', () => {
  test('показывает сообщение о пустой корзине', () => {
    mockState = { ...mockState, items: [] };
    renderDrawer();
    expect(screen.getByText('Корзина пуста')).toBeInTheDocument();
  });

  test('не показывает кнопку оформления при пустой корзине', () => {
    mockState = { ...mockState, items: [] };
    renderDrawer();
    expect(screen.queryByRole('button', { name: /оформить заказ/i })).not.toBeInTheDocument();
  });
});

describe('CartDrawer: с товарами', () => {
  const ITEMS = [
    { id: 1, name: 'Органайзер', price: '850.00', quantity: 2 },
    { id: 2, name: 'Подставка', price: '1200.00', quantity: 1 },
  ];

  beforeEach(() => { mockState = { ...mockState, items: ITEMS }; });

  test('рендерит названия товаров', () => {
    renderDrawer();
    expect(screen.getByText('Органайзер')).toBeInTheDocument();
    expect(screen.getByText('Подставка')).toBeInTheDocument();
  });

  test('показывает кнопку "Оформить заказ"', () => {
    renderDrawer();
    expect(screen.getByRole('button', { name: /оформить заказ/i })).toBeInTheDocument();
  });

  test('показывает сумму заказа (850×2 + 1200×1 = 2900)', () => {
    renderDrawer();
    expect(screen.getByText(/2\s*900/)).toBeInTheDocument();
  });

  test('кнопка закрытия вызывает toggleDrawer(false)', () => {
    renderDrawer();
    const closeButtons = screen.getAllByRole('button');
    // Первая кнопка - крестик закрытия
    fireEvent.click(closeButtons[0]);
    expect(mockToggleDrawer).toHaveBeenCalledWith(false);
  });
});
