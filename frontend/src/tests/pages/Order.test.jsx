import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import theme from '../../theme';
import Order from '../../pages/Order/Order';

const mockSubmit = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../store/orderStore', () => ({
  default: () => ({ submitCustomOrder: mockSubmit, loading: false, error: null }),
}));
vi.mock('../../store/authStore', () => ({
  default: () => ({ user: { id: 1, name: 'Иван' } }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderOrder = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}><Order /></ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => { mockSubmit.mockClear(); mockNavigate.mockClear(); });

describe('Страница Order: отображение', () => {
  test('рендерит заголовок', () => {
    renderOrder();
    expect(screen.getByText('Заказать изделие')).toBeInTheDocument();
  });

  test('рендерит поле "Описание"', () => {
    renderOrder();
    expect(screen.getByPlaceholderText(/опишите/i)).toBeInTheDocument();
  });

  test('рендерит кнопку отправки', () => {
    renderOrder();
    expect(screen.getByRole('button', { name: /отправить заявку/i })).toBeInTheDocument();
  });

  test('кнопка заблокирована пока описание пустое', () => {
    renderOrder();
    expect(screen.getByRole('button', { name: /отправить заявку/i })).toBeDisabled();
  });

  test('кнопка активируется после заполнения описания', async () => {
    renderOrder();
    await userEvent.type(screen.getByPlaceholderText(/опишите/i), 'Нужна деталь');
    expect(screen.getByRole('button', { name: /отправить заявку/i })).not.toBeDisabled();
  });
});

describe('Страница Order: отправка', () => {
  test('submit вызывает submitCustomOrder', async () => {
    mockSubmit.mockResolvedValueOnce({ success: true, message: 'Заказ отправлен' });
    renderOrder();

    await userEvent.type(screen.getByPlaceholderText(/опишите/i), 'Тестовая деталь');
    fireEvent.click(screen.getByRole('button', { name: /отправить заявку/i }));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Тестовая деталь' })
    ));
  });

  test('показывает success-экран при успехе', async () => {
    mockSubmit.mockResolvedValueOnce({ success: true, message: 'Заказ отправлен' });
    renderOrder();

    await userEvent.type(screen.getByPlaceholderText(/опишите/i), 'Тест');
    fireEvent.click(screen.getByRole('button', { name: /отправить заявку/i }));

    await waitFor(() => expect(screen.getByText('Заявка отправлена!')).toBeInTheDocument());
  });
});
