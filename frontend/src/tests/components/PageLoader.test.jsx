import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import PageLoader from '../../components/PageLoader/PageLoader';

const Wrapper = ({ initialPath = '/' }) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <ThemeProvider theme={theme}>
      <PageLoader />
    </ThemeProvider>
  </MemoryRouter>
);

describe('PageLoader', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('рендерится без ошибок', () => {
    const { container } = render(<Wrapper />);
    expect(container.firstChild).toBeTruthy();
  });

  test('показывает прогресс-бар при монтировании', () => {
    const { container } = render(<Wrapper />);
    const bar = container.querySelector('div > div');
    expect(bar).toBeTruthy();
  });

  test('полоса имеет ненулевую ширину после первого тика', () => {
    const { container } = render(<Wrapper />);
    act(() => { vi.advanceTimersByTime(60); });
    const bar = container.querySelector('div > div');
    // width should be set to >0 after first timeout fires
    expect(bar.style.width).not.toBe('0%');
  });

  test('скрывается через 750мс после монтирования', () => {
    const { container } = render(<Wrapper />);
    act(() => { vi.advanceTimersByTime(800); });
    const wrapper = container.firstChild;
    expect(wrapper.style.opacity).toBe('0');
  });
});
