import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import ProductCard from '../../components/ProductCard/ProductCard';

// Мокаем cartStore
const mockAddItem = vi.fn();
const mockToggleDrawer = vi.fn();
vi.mock('../../store/cartStore', () => ({
  default: () => ({ addItem: mockAddItem, toggleDrawer: mockToggleDrawer }),
}));

const renderCard = (product) =>
  render(
    <ThemeProvider theme={theme}>
      <ProductCard product={product} />
    </ThemeProvider>
  );

const BASE_PRODUCT = {
  id: 1, name: 'Органайзер для стола', description: 'Компактный органайзер',
  price: '850.00', category: 'Органайзеры', material: 'PLA', stock: 10,
};

beforeEach(() => { mockAddItem.mockClear(); mockToggleDrawer.mockClear(); });

describe('ProductCard: отображение', () => {
  test('рендерит название товара', () => {
    renderCard(BASE_PRODUCT);
    expect(screen.getByText('Органайзер для стола')).toBeInTheDocument();
  });

  test('рендерит цену', () => {
    renderCard(BASE_PRODUCT);
    expect(screen.getByText(/850/)).toBeInTheDocument();
  });

  test('рендерит категорию', () => {
    renderCard(BASE_PRODUCT);
    expect(screen.getByText('Органайзеры')).toBeInTheDocument();
  });

  test('рендерит материал', () => {
    renderCard(BASE_PRODUCT);
    expect(screen.getByText('PLA')).toBeInTheDocument();
  });

  test('показывает чип "Нет в наличии" при stock=0', () => {
    renderCard({ ...BASE_PRODUCT, stock: 0 });
    expect(screen.getByText('Нет в наличии')).toBeInTheDocument();
  });

  test('показывает остаток при stock<=5', () => {
    renderCard({ ...BASE_PRODUCT, stock: 3 });
    expect(screen.getByText('Осталось: 3')).toBeInTheDocument();
  });

  test('не показывает чип остатка при достаточном stock', () => {
    renderCard(BASE_PRODUCT); // stock=10
    expect(screen.queryByText(/Осталось/)).not.toBeInTheDocument();
  });
});

describe('ProductCard: взаимодействие', () => {
  test('кнопка "В корзину" активна при наличии товара', () => {
    renderCard(BASE_PRODUCT);
    const btn = screen.getByRole('button', { name: /в корзину/i });
    expect(btn).not.toBeDisabled();
  });

  test('кнопка "В корзину" задизейблена при stock=0', () => {
    renderCard({ ...BASE_PRODUCT, stock: 0 });
    const btn = screen.getByRole('button', { name: /в корзину/i });
    expect(btn).toBeDisabled();
  });

  test('клик вызывает addItem с нужным продуктом', () => {
    renderCard(BASE_PRODUCT);
    fireEvent.click(screen.getByRole('button', { name: /в корзину/i }));
    expect(mockAddItem).toHaveBeenCalledWith(BASE_PRODUCT);
  });

  test('клик открывает drawer', () => {
    renderCard(BASE_PRODUCT);
    fireEvent.click(screen.getByRole('button', { name: /в корзину/i }));
    expect(mockToggleDrawer).toHaveBeenCalledWith(true);
  });
});
