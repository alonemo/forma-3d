import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Button, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  IconButton, Tooltip, Grid, InputAdornment, Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import useOrderStore from '../../store/orderStore';
import { createProductApi, updateProductApi, deleteProductApi, uploadProductImageApi } from '../../api/admin';
import { getProductsApi } from '../../api/products';
import FadeText from '../../components/FadeText/FadeText';
import { mediaUrl } from '../../utils/mediaUrl';
import styles from './Admin.module.css';

const STATUS_OPTIONS = [
  { value: 'created',     label: 'Создан',     color: 'default' },
  { value: 'in_progress', label: 'В процессе', color: 'warning' },
  { value: 'ready',       label: 'Готово',      color: 'success' },
  { value: 'cancelled',   label: 'Отменён',     color: 'error' },
];

const STATUS_NEXT = { created: 'in_progress', in_progress: 'ready' };
const STATUS_NEXT_LABEL = { created: 'В процессе', in_progress: 'Готово' };

const EMPTY_PRODUCT = { name: '', description: '', price: '', category: '', material: '', image_url: '', stock: '0' };
const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin'];

export default function Admin() {
  const [tab, setTab] = useState(0);
  const { adminOrders, fetchAdminOrders, updateStatus, loading } = useOrderStore();
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, product: null });
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saveError, setSaveError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Category selector state
  const [newCatMode, setNewCatMode] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);

  // Cancel order dialog state
  const [cancelDialog, setCancelDialog] = useState({ open: false, orderId: null, reason: '' });
  const [cancelError, setCancelError] = useState('');

  // Delete product dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null, productName: '' });

  useEffect(() => { fetchAdminOrders(); }, []);
  useEffect(() => { if (tab === 1) loadProducts(); }, [tab]);

  const loadProducts = async () => {
    setProdLoading(true);
    try { const { data } = await getProductsApi({}); setProducts(data); } finally { setProdLoading(false); }
  };

  const existingCategories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const openDialog = (product = null) => {
    setForm(product ? { ...product, price: String(product.price), stock: String(product.stock) } : EMPTY_PRODUCT);
    setSaveError('');
    setNewCatMode(false);
    setNewCatInput('');
    setDialog({ open: true, product });
  };

  const saveProduct = async () => {
    setSaveError('');
    // if user typed a new category but didn't click ✓, apply it now
    const category = newCatMode && newCatInput.trim() ? newCatInput.trim() : form.category;
    try {
      const payload = { ...form, category, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
      if (dialog.product) await updateProductApi(dialog.product.id, payload);
      else await createProductApi(payload);
      setDialog({ open: false, product: null });
      loadProducts();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const { data } = await uploadProductImageApi(file);
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch {
      setSaveError('Не удалось загрузить изображение');
    } finally {
      setImageUploading(false);
    }
  };

  const removeProduct = (id, name) => {
    setDeleteDialog({ open: true, productId: id, productName: name });
  };

  const confirmDelete = async () => {
    await deleteProductApi(deleteDialog.productId);
    setDeleteDialog({ open: false, productId: null, productName: '' });
    loadProducts();
  };

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const next = STATUS_NEXT[currentStatus];
    if (!next) return;
    await updateStatus(orderId, next);
  };

  const openCancelDialog = (orderId) => {
    setCancelDialog({ open: true, orderId, reason: '' });
    setCancelError('');
  };

  const handleCancelOrder = async () => {
    setCancelError('');
    const ok = await updateStatus(cancelDialog.orderId, 'cancelled', cancelDialog.reason || null);
    if (ok) setCancelDialog({ open: false, orderId: null, reason: '' });
    else setCancelError('Не удалось отменить заказ');
  };

  const filteredOrders = filterStatus
    ? adminOrders.filter((o) => o.status === filterStatus)
    : adminOrders;

  return (
    <div>
      <section className={styles.hero}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="warning.main" fontWeight={700} letterSpacing={2}>Панель управления</Typography>
          <Typography variant="h3" fontWeight={800}>Администратор</Typography>
        </Container>
      </section>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Tab label="Заказы" />
          <Tab label="Каталог" />
        </Tabs>

        {/* ORDERS */}
        {tab === 0 && (
          <div className={styles.tabPanel}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography color="text.secondary" variant="body2">Фильтр:</Typography>
              <Chip label="Все" size="small" variant={!filterStatus ? 'filled' : 'outlined'} onClick={() => setFilterStatus('')} sx={!filterStatus ? { background: 'rgba(0,229,255,0.12)', color: '#00e5ff' } : {}} />
              {STATUS_OPTIONS.map((s) => (
                <Chip key={s.value} label={s.label} size="small" color={filterStatus === s.value ? s.color : 'default'} variant={filterStatus === s.value ? 'filled' : 'outlined'} onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)} />
              ))}
            </Box>

            <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Table size="small" sx={{ minWidth: 750 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Клиент</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Состав</TableCell>
                    <TableCell>Сумма</TableCell>
                    <TableCell>Дата</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const st = STATUS_OPTIONS.find((s) => s.value === order.status);
                    const canAdvance = !!STATUS_NEXT[order.status];
                    const canCancel = order.status === 'created' || order.status === 'in_progress';
                    return (
                      <TableRow key={order.id} className={styles.tableRow}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{order.user_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{order.user_email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={order.type === 'catalog' ? 'Каталог' : 'Инд.'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {order.type === 'catalog' && order.items?.map((i) => (
                            <Typography key={i.name} variant="caption" display="block" color="text.secondary">{i.name} ×{i.quantity}</Typography>
                          ))}
                          {order.type === 'custom' && order.custom_detail && (
                            <FadeText variant="caption" color="text.secondary" lines={2}>
                              {order.custom_detail.description}
                            </FadeText>
                          )}
                          {order.status === 'cancelled' && order.cancel_reason && (
                            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                              Причина: {order.cancel_reason}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{order.total_price ? `${parseFloat(order.total_price).toLocaleString('ru-RU')} ₽` : '—'}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(order.created_at).toLocaleDateString('ru-RU')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={st?.label} size="small" color={st?.color} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {canAdvance && (
                              <Tooltip title={`→ ${STATUS_NEXT_LABEL[order.status]}`}>
                                <IconButton size="small" color="primary" onClick={() => handleAdvanceStatus(order.id, order.status)}>
                                  <ArrowForwardIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canCancel && (
                              <Tooltip title="Отменить заказ">
                                <IconButton size="small" color="error" onClick={() => openCancelDialog(order.id)}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Заказов нет</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 1 && (
          <div className={styles.tabPanel}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Добавить товар</Button>
            </Box>

            <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Материал</TableCell>
                    <TableCell>Цена</TableCell>
                    <TableCell>Склад</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} className={styles.tableRow}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      </TableCell>
                      <TableCell><Chip label={p.category || '—'} size="small" variant="outlined" /></TableCell>
                      <TableCell><Chip label={p.material || '—'} size="small" /></TableCell>
                      <TableCell>{parseFloat(p.price).toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell>
                        <Chip label={p.stock} size="small" color={p.stock === 0 ? 'error' : p.stock <= 5 ? 'warning' : 'success'} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openDialog(p)} sx={{ mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => removeProduct(p.id, p.name)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </Container>

      {/* Product Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, product: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { background: '#12121a' } }}>
        <DialogTitle fontWeight={700}>{dialog.product ? 'Редактировать товар' : 'Новый товар'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Название *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={6}>
              <TextField fullWidth label="Цена (₽) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={styles.noSpinner} />
            </Grid>
            <Grid item xs={6} sm={6}>
              <TextField fullWidth label="Склад (шт.)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={styles.noSpinner} />
            </Grid>

            {/* Category selector */}
            <Grid item xs={12} sm={6}>
              {newCatMode ? (
                <TextField
                  fullWidth
                  autoFocus
                  label="Новая категория"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCatInput.trim()) {
                      setForm({ ...form, category: newCatInput.trim() });
                      setNewCatMode(false);
                    }
                    if (e.key === 'Escape') { setNewCatMode(false); setNewCatInput(''); }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { if (newCatInput.trim()) { setForm({ ...form, category: newCatInput.trim() }); setNewCatMode(false); } }}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => { setNewCatMode(false); setNewCatInput(''); }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  fullWidth
                  select
                  label="Категория"
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === '__new__') { setNewCatMode(true); setNewCatInput(''); }
                    else setForm({ ...form, category: e.target.value });
                  }}
                >
                  <MenuItem value="">— Не выбрано —</MenuItem>
                  {existingCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                  {/* show current value as option if it's a newly created category not yet in the list */}
                  {form.category && !existingCategories.includes(form.category) && (
                    <MenuItem key="__current__" value={form.category}>{form.category}</MenuItem>
                  )}
                  {existingCategories.length > 0 && <Divider />}
                  <MenuItem value="__new__" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    + Добавить категорию...
                  </MenuItem>
                </TextField>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Материал" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
                <MenuItem value="">— Не выбрано —</MenuItem>
                {MATERIALS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Изображение
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                {/* preview */}
                <Box sx={{
                  width: { xs: '100%', sm: 120 }, height: 120, flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2,
                  overflow: 'hidden', background: 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {form.image_url
                    ? <img src={mediaUrl(form.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', px: 1 }}>нет фото</Typography>
                  }
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 120 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    disabled={imageUploading}
                    sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#e8e8f0', alignSelf: 'flex-start' }}
                  >
                    {imageUploading ? 'Загрузка...' : 'Загрузить файл'}
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </Button>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="или вставьте URL"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />
                    <Box sx={{
                      position: 'absolute', right: 2, top: 2, bottom: 2, width: 44,
                      background: 'linear-gradient(to right, transparent, #12121a)',
                      pointerEvents: 'none', borderRadius: '0 6px 6px 0', zIndex: 1,
                    }} />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialog({ open: false, product: null })}>Отмена</Button>
          <Button variant="contained" onClick={saveProduct}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, productId: null, productName: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { background: '#12121a' } }}>
        <DialogTitle fontWeight={700}>Удалить товар?</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Вы собираетесь удалить товар <strong style={{ color: '#e8e8f0' }}>{deleteDialog.productName}</strong>. Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialog({ open: false, productId: null, productName: '' })}>Отмена</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Удалить</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, orderId: null, reason: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { background: '#12121a' } }}>
        <DialogTitle fontWeight={700}>Отменить заказ #{cancelDialog.orderId}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Это действие нельзя отменить. При необходимости укажите причину отмены.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Причина отмены (необязательно)"
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog((d) => ({ ...d, reason: e.target.value }))}
            placeholder="Например: клиент отказался от заказа"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCancelDialog({ open: false, orderId: null, reason: '' })}>Назад</Button>
          <Button variant="contained" color="error" onClick={handleCancelOrder}>Отменить заказ</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
