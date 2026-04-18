import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import ProductDetail from '../../pages/ProductDetail/ProductDetail';

vi.mock('../../api/products', () => ({
  getProductApi: vi.fn(),
  getProductsApi: vi.fn(),
  getCategoriesApi: vi.fn(),
  getMaterialsApi: vi.fn(),
}));

const mockAddItem = vi.fn();
const mockToggleDrawer = vi.fn();
vi.mock('../../store/cartStore', () => ({
  default: () => ({ addItem: mockAddItem, toggleDrawer: mockToggleDrawer }),
}));

import { getProductApi } from '../../api/products';

const PRODUCT = {
  id: 42,
  name: 'Ваза «Слой»',
  description: 'Ваза с выраженной текстурой слоёв печати.',
  price: '2400.00',
  category: 'Декор',
  material: 'PLA',
  stock: 5,
  image_url: null,
};

const renderAt = (path = '/catalog/42') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/catalog/:id" element={<ProductDetail />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockAddItem.mockClear();
  mockToggleDrawer.mockClear();
  getProductApi.mockResolvedValue({ data: PRODUCT });
});

describe('ProductDetail: рендер', () => {
  test('показывает название товара после загрузки', async () => {
    renderAt();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /ваза/i })).toBeInTheDocument()
    );
  });

  test('показывает цену', async () => {
    renderAt();
    await waitFor(() => expect(screen.getAllByText(/2\s*400/).length).toBeGreaterThan(0));
  });

  test('показывает описание', async () => {
    renderAt();
    await waitFor(() =>
      expect(screen.getByText(/текстурой слоёв печати/i)).toBeInTheDocument()
    );
  });

  test('показывает материал в спеках', async () => {
    renderAt();
    await waitFor(() => expect(screen.getAllByText(/pla/i).length).toBeGreaterThan(0));
  });

  test('показывает хлебные крошки', async () => {
    renderAt();
    await waitFor(() => expect(screen.getByRole('button', { name: /главная/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /каталог/i })).toBeInTheDocument();
  });
});

describe('ProductDetail: взаимодействие', () => {
  test('кнопка "В корзину" вызывает addItem с выбранным количеством', async () => {
    renderAt();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /ваза/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /в корзину/i }));
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    const [product, qty] = mockAddItem.mock.calls[0];
    expect(product.id).toBe(42);
    expect(qty).toBe(1);
  });

  test('увеличение количества меняет сумму в кнопке', async () => {
    renderAt();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /ваза/i })).toBeInTheDocument()
    );
    const plus = screen.getByRole('button', { name: /больше/i });
    fireEvent.click(plus);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /в корзину.*4\s*800/i })).toBeInTheDocument()
    );
  });

  test('для товара с stock=0 показывает «Нет в наличии» и блокирует кнопку', async () => {
    getProductApi.mockResolvedValue({ data: { ...PRODUCT, stock: 0 } });
    renderAt();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /ваза/i })).toBeInTheDocument()
    );
    const btn = screen.getByRole('button', { name: /нет в наличии/i });
    expect(btn).toBeDisabled();
  });
});

describe('ProductDetail: not found', () => {
  test('показывает fallback при ошибке загрузки', async () => {
    getProductApi.mockRejectedValue(new Error('not found'));
    renderAt();
    await waitFor(() => expect(screen.getByText(/товар не найден/i)).toBeInTheDocument());
  });
});
