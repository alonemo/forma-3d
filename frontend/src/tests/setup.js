import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Мокаем CSS Modules — возвращаем имя класса как есть
vi.mock('*.module.css', () => new Proxy({}, { get: (_, key) => key }));

// Мокаем react-router-dom по умолчанию
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Заглушка для window.matchMedia (нужна MUI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
