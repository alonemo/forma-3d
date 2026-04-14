import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import Catalog from '../../pages/Catalog/Catalog';

vi.mock('../../api/products', () => ({
  getProductsApi: vi.fn(),
  getCategoriesApi: vi.fn(),
  getMaterialsApi: vi.fn(),
}));

import { getProductsApi, getCategoriesApi, getMaterialsApi } from '../../api/products';

const PRODUCTS = [
  { id: 1, name: 'Органайзер', description: 'Компактный', price: 850, category: 'Органайзеры', material: 'PLA', stock: 10, image_url: null },
  { id: 2, name: 'Подставка', description: 'Эргономичная', price: 1200, category: 'Подставки', material: 'PETG', stock: 0, image_url: null },
];

const renderCatalog = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <Catalog />
      </ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  getCategoriesApi.mockResolvedValue({ data: ['Органайзеры', 'Подставки'] });
  getMaterialsApi.mockResolvedValue({ data: ['PLA', 'PETG'] });
  getProductsApi.mockResolvedValue({ data: PRODUCTS });
});

describe('Catalog: рендер', () => {
  test('показывает заголовок каталога', async () => {
    renderCatalog();
    expect(screen.getByText('Готовые изделия')).toBeInTheDocument();
  });

  test('показывает скелетоны при начальной загрузке', () => {
    getProductsApi.mockReturnValue(new Promise(() => {})); // never resolves
    renderCatalog();
    // Skeleton рендерится как div с aria-hidden
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('отображает загруженные товары', async () => {
    renderCatalog();
    await waitFor(() => expect(screen.getByText('Органайзер')).toBeInTheDocument());
    expect(screen.getByText('Подставка')).toBeInTheDocument();
  });

  test('показывает счётчик найденных товаров', async () => {
    renderCatalog();
    await waitFor(() => expect(screen.getByText(/найдено: 2/i)).toBeInTheDocument());
  });

  test('показывает "Ничего не найдено" при пустом результате', async () => {
    getProductsApi.mockResolvedValue({ data: [] });
    renderCatalog();
    await waitFor(() => expect(screen.getByText(/ничего не найдено/i)).toBeInTheDocument());
  });
});

describe('Catalog: фильтры', () => {
  test('рендерит категории из API', async () => {
    renderCatalog();
    // getAllByText т.к. категория есть и в фильтре, и в чипе карточки товара
    await waitFor(() => expect(screen.getAllByText('Органайзеры').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Подставки').length).toBeGreaterThan(0);
  });

  test('рендерит материалы из API', async () => {
    renderCatalog();
    // getAllByText т.к. материал встречается и в фильтре, и в карточке товара
    await waitFor(() => expect(screen.getAllByText('PLA').length).toBeGreaterThan(0));
    expect(screen.getAllByText('PETG').length).toBeGreaterThan(0);
  });

  test('поисковое поле присутствует', async () => {
    renderCatalog();
    expect(screen.getByPlaceholderText(/поиск/i)).toBeInTheDocument();
  });

  test('кнопка "Сбросить фильтры" не отображается по умолчанию', async () => {
    renderCatalog();
    await waitFor(() => expect(screen.getByText(/найдено/i)).toBeInTheDocument());
    expect(screen.queryByText(/сбросить фильтры/i)).not.toBeInTheDocument();
  });

  test('кнопка "Сбросить фильтры" появляется после ввода в поиск', async () => {
    renderCatalog();
    await waitFor(() => expect(screen.getByPlaceholderText(/поиск/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/поиск/i), { target: { value: 'тест' } });
    await waitFor(() => expect(screen.getByText(/сбросить фильтры/i)).toBeInTheDocument());
  });
});

describe('Catalog: товар без наличия', () => {
  test('кнопка "В корзину" задизейблена для товара с stock=0', async () => {
    renderCatalog();
    await waitFor(() => expect(screen.getByText('Подставка')).toBeInTheDocument());
    const buttons = screen.getAllByRole('button', { name: /в корзину/i });
    // Подставка (stock=0) — второй товар, её кнопка disabled
    const disabledBtn = buttons.find((b) => b.disabled);
    expect(disabledBtn).toBeTruthy();
  });
});
