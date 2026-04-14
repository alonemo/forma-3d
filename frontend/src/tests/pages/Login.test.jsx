import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import theme from '../../theme';
import Login from '../../pages/Auth/Login';

const mockLogin = vi.fn();
const mockClearError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../store/authStore', () => ({
  default: () => ({ login: mockLogin, loading: false, error: null, clearError: mockClearError }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}><Login /></ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => { mockLogin.mockClear(); mockNavigate.mockClear(); mockClearError.mockClear(); });

describe('Страница Login: отображение', () => {
  test('рендерит заголовок', () => {
    renderLogin();
    expect(screen.getByText('Добро пожаловать')).toBeInTheDocument();
  });

  test('рендерит поля email и пароль', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
  });

  test('рендерит кнопку входа', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  test('рендерит ссылку на регистрацию', () => {
    renderLogin();
    expect(screen.getByText(/зарегистрироваться/i)).toBeInTheDocument();
  });
});

describe('Страница Login: взаимодействие', () => {
  test('вводит значения в поля', async () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');
  });

  test('submit вызывает login с введёнными данными', async () => {
    mockLogin.mockResolvedValueOnce(true);
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'ivan@test.ru');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('ivan@test.ru', 'password123');
    });
  });

  test('при успешном входе перенаправляет на /profile', async () => {
    mockLogin.mockResolvedValueOnce(true);
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'ivan@test.ru');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'pass123');
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/profile'));
  });

  test('при неудачном входе не перенаправляет', async () => {
    mockLogin.mockResolvedValueOnce(false);
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'x@x.ru');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('Страница Login: ошибки', () => {
  test('не показывает Alert если нет ошибки', () => {
    renderLogin();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
