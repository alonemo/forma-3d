import { describe, test, expect, beforeEach, vi } from 'vitest';

// Мокаем API заказов до импорта store
vi.mock('../../api/orders', () => ({
  createCatalogOrderApi: vi.fn(),
}));

import { createCatalogOrderApi } from '../../api/orders';

// Используем act для сброса стора между тестами
import { act } from '@testing-library/react';

// Импортируем стор ПОСЛЕ мока
let useCartStore;
beforeEach(async () => {
  vi.resetModules();
  vi.mock('../../api/orders', () => ({ createCatalogOrderApi: vi.fn() }));
  const mod = await import('../../store/cartStore');
  useCartStore = mod.default;
  // Сбрасываем состояние
  act(() => useCartStore.setState({ items: [], open: false }));
});

const PRODUCT_A = { id: 1, name: 'Органайзер', price: '850.00', stock: 10 };
const PRODUCT_B = { id: 2, name: 'Подставка', price: '1200.00', stock: 5 };

describe('cartStore: добавление товаров', () => {
  test('добавляет новый товар с quantity=1', () => {
    act(() => useCartStore.getState().addItem(PRODUCT_A));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 1, quantity: 1 });
  });

  test('увеличивает quantity при повторном добавлении того же товара', () => {
    act(() => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().addItem(PRODUCT_A);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  test('добавляет несколько разных товаров', () => {
    act(() => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().addItem(PRODUCT_B);
    });
    expect(useCartStore.getState().items).toHaveLength(2);
  });
});

describe('cartStore: удаление и изменение количества', () => {
  test('удаляет товар из корзины', () => {
    act(() => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().removeItem(1);
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  test('updateQuantity изменяет количество', () => {
    act(() => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().updateQuantity(1, 5);
    });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  test('updateQuantity(id, 0) удаляет товар', () => {
    act(() => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().updateQuantity(1, 0);
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  test('clearCart очищает корзину', () => {
    act(() => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().addItem(PRODUCT_B);
      useCartStore.getState().clearCart();
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cartStore: подсчёт total', () => {
  test('считает сумму корзины', () => {
    act(() => {
      useCartStore.getState().addItem(PRODUCT_A); // 850 × 1
      useCartStore.getState().addItem(PRODUCT_B); // 1200 × 1
    });
    const { items } = useCartStore.getState();
    const total = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    expect(total).toBe(2050);
  });
});

describe('cartStore: drawer', () => {
  test('toggleDrawer меняет open', () => {
    act(() => useCartStore.getState().toggleDrawer(true));
    expect(useCartStore.getState().open).toBe(true);
    act(() => useCartStore.getState().toggleDrawer(false));
    expect(useCartStore.getState().open).toBe(false);
  });
});

describe('cartStore: checkout', () => {
  test('успешный checkout очищает корзину', async () => {
    const { createCatalogOrderApi } = await import('../../api/orders');
    createCatalogOrderApi.mockResolvedValueOnce({ data: { message: 'Заказ создан' } });

    act(() => useCartStore.getState().addItem(PRODUCT_A));
    const result = await useCartStore.getState().checkout();

    expect(result.success).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  test('неудачный checkout не очищает корзину', async () => {
    const { createCatalogOrderApi } = await import('../../api/orders');
    createCatalogOrderApi.mockRejectedValueOnce({ response: { data: { error: 'Ошибка' } } });

    act(() => useCartStore.getState().addItem(PRODUCT_A));
    const result = await useCartStore.getState().checkout();

    expect(result.success).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});
