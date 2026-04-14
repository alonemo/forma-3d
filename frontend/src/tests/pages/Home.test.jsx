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
    expect(screen.getByText(/воплощаем/i)).toBeInTheDocument();
  });

  test('рендерит подзаголовок hero', () => {
    renderHome();
    expect(screen.getByText(/профессиональная 3d-печать/i)).toBeInTheDocument();
  });

  test('рендерит кнопку "Заказать изделие"', () => {
    renderHome();
    expect(screen.getByRole('button', { name: /заказать изделие/i })).toBeInTheDocument();
  });

  test('рендерит кнопку "Смотреть каталог"', () => {
    renderHome();
    expect(screen.getByRole('button', { name: /смотреть каталог/i })).toBeInTheDocument();
  });

  test('рендерит секцию преимуществ', () => {
    renderHome();
    expect(screen.getByText('Наши преимущества')).toBeInTheDocument();
  });

  test('рендерит 6 карточек преимуществ', () => {
    renderHome();
    expect(screen.getByText('Быстрое изготовление')).toBeInTheDocument();
    expect(screen.getByText('Точность до 0.1 мм')).toBeInTheDocument();
    expect(screen.getByText('Постобработка')).toBeInTheDocument();
  });

  test('рендерит секцию "Как это работает"', () => {
    renderHome();
    expect(screen.getByText('Как это работает')).toBeInTheDocument();
  });

  test('рендерит шаги процесса', () => {
    renderHome();
    expect(screen.getByText('Оставьте заявку')).toBeInTheDocument();
    expect(screen.getByText('Согласование')).toBeInTheDocument();
    expect(screen.getByText('Производство')).toBeInTheDocument();
    expect(screen.getByText('Получение')).toBeInTheDocument();
  });

  test('рендерит секцию материалов', () => {
    renderHome();
    expect(screen.getByText('PLA')).toBeInTheDocument();
    expect(screen.getByText('PETG')).toBeInTheDocument();
    expect(screen.getByText('ABS')).toBeInTheDocument();
    expect(screen.getByText('Resin')).toBeInTheDocument();
  });

  test('рендерит CTA секцию', () => {
    renderHome();
    expect(screen.getByText('Готовы начать?')).toBeInTheDocument();
  });

  test('рендерит статистику', () => {
    renderHome();
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('0.1 мм')).toBeInTheDocument();
  });
});
