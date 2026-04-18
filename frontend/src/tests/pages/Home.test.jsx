import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import theme from '../../theme';
import Home from '../../pages/Home/Home';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

// Mock product fetch so the network call inside Home doesn't fail in jsdom
vi.mock('../../api/products', () => ({
  getProductsApi: () => Promise.resolve({ data: [] }),
  getProductApi: () => Promise.resolve({ data: null }),
  getCategoriesApi: () => Promise.resolve({ data: [] }),
  getMaterialsApi: () => Promise.resolve({ data: [] }),
}));

// IntersectionObserver не существует в jsdom
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}><Home /></ThemeProvider>
    </MemoryRouter>
  );

describe('Страница Home: контент', () => {
  test('рендерит главный заголовок', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1, name: /собранные/i })).toBeInTheDocument();
  });

  test('рендерит hero-эйбрау со студией и городом', () => {
    renderHome();
    expect(screen.getByText(/студия 3d-печати.*москва/i)).toBeInTheDocument();
  });

  test('рендерит кнопку "Смотреть каталог"', () => {
    renderHome();
    expect(screen.getByRole('button', { name: /смотреть каталог/i })).toBeInTheDocument();
  });

  test('рендерит кнопку "Заказать изделие"', () => {
    renderHome();
    expect(screen.getByRole('button', { name: /заказать изделие/i })).toBeInTheDocument();
  });

  test('рендерит hero-мета метки', () => {
    renderHome();
    expect(screen.getByText('Принтеров')).toBeInTheDocument();
    expect(screen.getByText('Работ выполнено')).toBeInTheDocument();
    expect(screen.getByText('Средний срок')).toBeInTheDocument();
  });

  test('рендерит блок философии', () => {
    renderHome();
    expect(screen.getByText(/мы не прячем слои печати/i)).toBeInTheDocument();
  });

  test('рендерит 4 шага процесса', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 4, name: /модель и цвет/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: /на одном станке/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: /руки мастера/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: /3–7 дней/i })).toBeInTheDocument();
  });

  test('рендерит секцию бестселлеров', () => {
    renderHome();
    expect(screen.getByText(/бестселлеры/i)).toBeInTheDocument();
  });

  test('рендерит ticker с материалами', () => {
    renderHome();
    // ticker content is rendered twice for seamless infinite scroll
    expect(screen.getAllByText(/pla из кукурузы/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/petg/i).length).toBeGreaterThan(0);
  });
});
