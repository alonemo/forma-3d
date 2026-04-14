import { describe, test, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

vi.mock('../../api/auth', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  getMeApi: vi.fn(),
}));

let useAuthStore;
let loginApi, registerApi, getMeApi;

beforeEach(async () => {
  vi.resetModules();
  vi.mock('../../api/auth', () => ({
    loginApi: vi.fn(),
    registerApi: vi.fn(),
    getMeApi: vi.fn(),
  }));
  const storeMod = await import('../../store/authStore');
  const apiMod = await import('../../api/auth');
  useAuthStore = storeMod.default;
  loginApi = apiMod.loginApi;
  registerApi = apiMod.registerApi;
  getMeApi = apiMod.getMeApi;
  act(() => useAuthStore.setState({ user: null, token: null, loading: false, error: null }));
  localStorage.clear();
});

describe('authStore: login', () => {
  test('успешный логин сохраняет user и token', async () => {
    loginApi.mockResolvedValueOnce({
      data: { token: 'abc123', user: { id: 1, name: 'Иван', email: 'ivan@test.ru', role: 'user' } },
    });

    let result;
    await act(async () => { result = await useAuthStore.getState().login('ivan@test.ru', 'pass'); });

    expect(result).toBe(true);
    expect(useAuthStore.getState().user).toMatchObject({ id: 1, name: 'Иван' });
    expect(useAuthStore.getState().token).toBe('abc123');
    expect(localStorage.getItem('token')).toBe('abc123');
  });

  test('неудачный логин сохраняет error', async () => {
    loginApi.mockRejectedValueOnce({ response: { data: { error: 'Неверный пароль' } } });

    let result;
    await act(async () => { result = await useAuthStore.getState().login('x@x.ru', 'wrong'); });

    expect(result).toBe(false);
    expect(useAuthStore.getState().error).toBe('Неверный пароль');
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('authStore: register', () => {
  test('успешная регистрация сохраняет user и token', async () => {
    registerApi.mockResolvedValueOnce({
      data: { token: 'tok777', user: { id: 5, name: 'Маша', email: 'masha@test.ru', role: 'user' } },
    });

    let result;
    await act(async () => { result = await useAuthStore.getState().register('Маша', 'masha@test.ru', 'pass123'); });

    expect(result).toBe(true);
    expect(useAuthStore.getState().user?.name).toBe('Маша');
  });
});

describe('authStore: logout', () => {
  test('logout очищает user, token и localStorage', () => {
    act(() => useAuthStore.setState({ user: { id: 1 }, token: 'tok' }));
    localStorage.setItem('token', 'tok');

    act(() => useAuthStore.getState().logout());

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('authStore: clearError', () => {
  test('сбрасывает поле error', () => {
    act(() => useAuthStore.setState({ error: 'Какая-то ошибка' }));
    act(() => useAuthStore.getState().clearError());
    expect(useAuthStore.getState().error).toBeNull();
  });
});
