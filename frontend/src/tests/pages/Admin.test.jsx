import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import Admin from '../../pages/Admin/Admin';

const mockDeleteProductApi = vi.fn();
const mockGetProductsApi = vi.fn();
const mockFetchAdminOrders = vi.fn();
const mockUpdateStatus = vi.fn();

vi.mock('../../store/orderStore', () => ({
  default: () => ({
    adminOrders: [],
    fetchAdminOrders: mockFetchAdminOrders,
    updateStatus: mockUpdateStatus,
    loading: false,
  }),
}));

vi.mock('../../api/products', () => ({
  getProductsApi: (...args) => mockGetProductsApi(...args),
}));

vi.mock('../../api/admin', () => ({
  createProductApi: vi.fn(),
  updateProductApi: vi.fn(),
  deleteProductApi: (...args) => mockDeleteProductApi(...args),
  uploadProductImageApi: vi.fn(),
}));

const PRODUCTS = [
  { id: 1, name: 'Органайзер', description: 'Компактный', price: 850, category: 'Органайзеры', material: 'PLA', stock: 10, image_url: null },
  { id: 2, name: 'Подставка', description: 'Эргономичная', price: 1200, category: 'Подставки', material: 'PETG', stock: 5, image_url: null },
];

const renderAdmin = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <Admin />
      </ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProductsApi.mockResolvedValue({ data: PRODUCTS });
  mockDeleteProductApi.mockResolvedValue({});
});

describe('Admin: вкладка каталога', () => {
  const openCatalogTab = async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('tab', { name: /каталог/i }));
    await waitFor(() => expect(screen.getByText('Органайзер')).toBeInTheDocument());
  };

  test('переключается на вкладку "Каталог" и показывает товары', async () => {
    await openCatalogTab();
    expect(screen.getByText('Подставка')).toBeInTheDocument();
  });

  test('кнопка удаления открывает диалог подтверждения', async () => {
    await openCatalogTab();
    const deleteButtons = screen.getAllByTestId
      ? screen.queryAllByRole('button')
      : screen.getAllByRole('button');

    // Find delete buttons by their icon (color="error" IconButton)
    // Trigger delete for first product
    const rows = screen.getAllByText('Органайзер');
    expect(rows.length).toBeGreaterThan(0);

    // Click delete icon for "Органайзер" (first product row)
    // Get all IconButtons — edit + delete per row
    const allButtons = screen.getAllByRole('button');
    // Delete button is after edit button for each row
    // Find by aria-label or by position — use the delete icons
    // The dialog should not be open yet
    expect(screen.queryByText('Удалить товар?')).not.toBeInTheDocument();

    // Click the delete (trash) button for the first product
    // In the table, each product row has edit + delete icon buttons
    // We look for buttons near "Органайзер" text — simplest: filter visible delete buttons
    // Since we can't easily select by icon, we rely on order: edit=0, delete=1, edit=2, delete=3...
    // Plus there's "Добавить товар" button. So first delete is index 2 (0=Добавить, 1=edit, 2=delete)
    fireEvent.click(allButtons[2]);

    await waitFor(() => expect(screen.getByText('Удалить товар?')).toBeInTheDocument());
  });

  test('диалог показывает название удаляемого товара', async () => {
    await openCatalogTab();
    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[2]); // delete for "Органайзер"

    await waitFor(() => expect(screen.getByText('Удалить товар?')).toBeInTheDocument());
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Органайзер')).toBeInTheDocument();
  });

  test('кнопка "Отмена" в диалоге закрывает его без удаления', async () => {
    await openCatalogTab();
    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[2]);

    await waitFor(() => expect(screen.getByText('Удалить товар?')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    await waitFor(() => expect(screen.queryByText('Удалить товар?')).not.toBeInTheDocument());
    expect(mockDeleteProductApi).not.toHaveBeenCalled();
  });

  test('кнопка "Удалить" в диалоге вызывает deleteProductApi и закрывает диалог', async () => {
    await openCatalogTab();
    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[2]);

    await waitFor(() => expect(screen.getByText('Удалить товар?')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => expect(mockDeleteProductApi).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('Удалить товар?')).not.toBeInTheDocument());
  });

  test('после удаления перезагружает список товаров', async () => {
    await openCatalogTab();
    mockGetProductsApi.mockClear(); // clear initial load call

    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[2]);

    await waitFor(() => expect(screen.getByText('Удалить товар?')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => expect(mockGetProductsApi).toHaveBeenCalledTimes(1));
  });
});

describe('Admin: вкладка заказов', () => {
  test('рендерится по умолчанию на вкладке заказов', () => {
    renderAdmin();
    expect(screen.getByRole('tab', { name: /заказы/i })).toBeInTheDocument();
    expect(screen.getByText('Заказов нет')).toBeInTheDocument();
  });
});
