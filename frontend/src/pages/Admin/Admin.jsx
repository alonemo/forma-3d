import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, TextField,
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
import { PRODUCT_PALETTE } from '../../components/ProductForm/ProductForm';
import styles from './Admin.module.css';

const STATUS_OPTIONS = [
  { value: 'created',     label: 'Создан',     color: 'default' },
  { value: 'in_progress', label: 'В процессе', color: 'warning' },
  { value: 'ready',       label: 'Готово',     color: 'success' },
  { value: 'cancelled',   label: 'Отменён',    color: 'error' },
];

const STATUS_NEXT = { created: 'in_progress', in_progress: 'ready' };
const STATUS_NEXT_LABEL = { created: 'В процессе', in_progress: 'Готово' };

const EMPTY_PRODUCT = { name: '', description: '', price: '', category: '', material: '', image_url: '', stock: '0', colors: [] };
const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin'];
const COLOR_CHOICES = [
  PRODUCT_PALETTE[0], // terracotta
  PRODUCT_PALETTE[1], // ochre
  PRODUCT_PALETTE[4], // charcoal
  PRODUCT_PALETTE[3], // sand
  PRODUCT_PALETTE[2], // olive
  PRODUCT_PALETTE[5], // forest
];

// Tick drives the synthetic layer progress for orders in `in_progress` status.
// Kept outside useMemo so each card gets a stable printer assignment.
function orderProgress(order, tick) {
  const total = parseFloat(order.total_price) || 1;
  const layers = Math.max(200, Math.round(total / 2.8));
  const span = layers - 1;
  const current = order.status === 'in_progress'
    ? Math.min(layers - 1, 80 + (tick * 2) % Math.max(1, span - 80))
    : (order.status === 'ready' ? layers : 0);
  const pct = Math.round((current / layers) * 100);
  const printerModel = ['Prusa MK4S', 'Bambu X1C', 'Elegoo Saturn', 'Creality K2'][order.id % 4];
  const printerNum = String((order.id % 4) + 1).padStart(2, '0');
  return { layers, current, pct, printer: `${printerModel} #${printerNum}` };
}

export default function Admin() {
  const [tab, setTab] = useState(0);
  const { adminOrders, fetchAdminOrders, updateStatus } = useOrderStore();
  const [products, setProducts] = useState([]);
  const [dialog, setDialog] = useState({ open: false, product: null });
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saveError, setSaveError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [newCatMode, setNewCatMode] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({ open: false, orderId: null, reason: '' });
  const [cancelError, setCancelError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null, productName: '' });

  // Local queue order override — drag-reorder is not persisted server-side.
  // Map of orderId → position index. Orders without an entry fall back to created_at order.
  const [queueOrder, setQueueOrder] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => { fetchAdminOrders(); loadProducts(); }, []);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1800);
    return () => clearInterval(t);
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await getProductsApi({});
      setProducts(data);
    } catch { /* ignore */ }
  };

  const existingCategories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const openDialog = (product = null) => {
    setForm(product
      ? {
          ...product,
          price: String(product.price),
          stock: String(product.stock),
          colors: Array.isArray(product.colors) ? product.colors : [],
        }
      : EMPTY_PRODUCT);
    setSaveError('');
    setNewCatMode(false);
    setNewCatInput('');
    setDialog({ open: true, product });
  };

  const toggleFormColor = (hex) => {
    const key = hex.toLowerCase();
    setForm((f) => {
      const current = Array.isArray(f.colors) ? f.colors : [];
      const has = current.map((c) => c.toLowerCase()).includes(key);
      return { ...f, colors: has ? current.filter((c) => c.toLowerCase() !== key) : [...current, hex] };
    });
  };

  const saveProduct = async () => {
    setSaveError('');
    const category = newCatMode && newCatInput.trim() ? newCatInput.trim() : form.category;
    try {
      const payload = {
        ...form,
        category,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        colors: Array.isArray(form.colors) ? form.colors : [],
      };
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

  // Queue = active orders (created + in_progress), ordered by user-set queueOrder,
  // otherwise by creation order (oldest first, i.e. first in queue).
  const queueOrders = useMemo(() => {
    const active = adminOrders.filter((o) => o.status === 'created' || o.status === 'in_progress');
    const byId = Object.fromEntries(active.map((o) => [o.id, o]));
    const result = [];
    for (const id of queueOrder) if (byId[id]) { result.push(byId[id]); delete byId[id]; }
    const remaining = Object.values(byId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return [...result, ...remaining];
  }, [adminOrders, queueOrder]);

  const moveQueue = (fromId, toId) => {
    if (fromId === toId) return;
    const ids = queueOrders.map((o) => o.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    const next = ids.slice();
    const [spliced] = next.splice(from, 1);
    next.splice(to, 0, spliced);
    setQueueOrder(next);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroNum}>Панель управления</div>
        <div>
          <h1 className={styles.heroTitle}>Администратор</h1>
          <p className={styles.heroLead}>
            Управление заказами и&nbsp;каталогом товаров.
          </p>
        </div>
      </section>

      <div className={styles.body}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid var(--rule)' }}>
          <Tab label="Печатный стол" />
          <Tab label="Каталог" />
          <Tab label="Мастера" />
        </Tabs>

        {tab === 0 && (
          <div className={styles.tabPanel}>
            <Box className={styles.filterBar}>
              <span className={styles.filterLabel}>Фильтр статуса:</span>
              <Chip
                label="Все"
                size="small"
                color={!filterStatus ? 'primary' : 'default'}
                variant={!filterStatus ? 'filled' : 'outlined'}
                onClick={() => setFilterStatus('')}
              />
              {STATUS_OPTIONS.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  size="small"
                  color={filterStatus === s.value ? s.color : 'default'}
                  variant={filterStatus === s.value ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
                />
              ))}
            </Box>

            <TableContainer sx={{ border: '1px solid var(--rule)', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 750 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
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
                          <Box sx={{ fontWeight: 500 }}>{order.user_name}</Box>
                          <Box sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-2)' }}>
                            {order.user_email}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.type === 'catalog' ? 'Каталог' : 'Инд.'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          {order.type === 'catalog' && order.items?.map((i) => (
                            <Box key={i.name} sx={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                              {i.name} ×{i.quantity}
                            </Box>
                          ))}
                          {order.type === 'custom' && order.custom_detail && (
                            <FadeText variant="caption" lines={2} sx={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                              {order.custom_detail.description}
                            </FadeText>
                          )}
                          {order.status === 'cancelled' && order.cancel_reason && (
                            <Box sx={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.7rem',
                              color: 'var(--error)',
                              mt: 0.5,
                            }}>
                              Причина: {order.cancel_reason}
                            </Box>
                          )}
                          {order.status === 'in_progress' && (() => {
                            const pr = orderProgress(order, tick);
                            return (
                              <Box sx={{ mt: 0.75 }}>
                                <Box sx={{
                                  fontFamily: 'var(--font-mono)', fontSize: '0.64rem',
                                  letterSpacing: '0.08em', color: 'var(--text-2)',
                                  display: 'flex', justifyContent: 'space-between',
                                  textTransform: 'uppercase', mb: 0.5,
                                }}>
                                  <span>{pr.printer}</span>
                                  <span>{pr.pct}% · {pr.current}/{pr.layers}</span>
                                </Box>
                                <Box sx={{
                                  height: 2, background: 'var(--rule)', position: 'relative', overflow: 'hidden',
                                }}>
                                  <Box sx={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0,
                                    width: `${pr.pct}%`, background: 'var(--accent)',
                                    transition: 'width 0.4s ease',
                                  }} />
                                </Box>
                              </Box>
                            );
                          })()}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'var(--font-mono)' }}>
                          {order.total_price ? `${parseFloat(order.total_price).toLocaleString('ru-RU')} ₽` : '—'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-2)' }}>
                          {new Date(order.created_at).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <Chip label={st?.label} size="small" color={st?.color} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {canAdvance && (
                              <Tooltip title={`→ ${STATUS_NEXT_LABEL[order.status]}`}>
                                <IconButton size="small" onClick={() => handleAdvanceStatus(order.id, order.status)}>
                                  <ArrowForwardIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canCancel && (
                              <Tooltip title="Отменить заказ">
                                <IconButton size="small" sx={{ color: 'var(--error)' }} onClick={() => openCancelDialog(order.id)}>
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
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: 'var(--text-2)' }}>
                        Заказов нет
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {tab === 1 && (
          <div className={styles.tabPanel}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openDialog()}
                className={styles.addBtn}
              >
                Добавить товар
              </Button>
            </Box>

            <TableContainer sx={{ border: '1px solid var(--rule)', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
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
                      <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                      <TableCell>
                        <Chip label={p.category || '—'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={p.material || '—'} size="small" />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'var(--font-mono)' }}>
                        {parseFloat(p.price).toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.stock}
                          size="small"
                          color={p.stock === 0 ? 'error' : p.stock <= 5 ? 'warning' : 'success'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openDialog(p)} sx={{ mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'var(--error)' }} onClick={() => removeProduct(p.id, p.name)}>
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

        {tab === 2 && (
          <div className={styles.tabPanel}>
            <Box className={styles.queueHead}>
              <div>
                <div className={styles.queueLabel}>Очередь печати</div>
                <div className={styles.queueHint}>
                  Перетащите заказ, чтобы изменить приоритет. Порядок сохраняется локально.
                </div>
              </div>
              <div className={styles.queueStats}>
                <span>{queueOrders.length}</span> в очереди
              </div>
            </Box>

            {queueOrders.length === 0 ? (
              <div className={styles.queueEmpty}>
                Активных заказов нет.
              </div>
            ) : (
              <ol className={styles.queueList}>
                {queueOrders.map((order, idx) => (
                  <QueueRow
                    key={order.id}
                    order={order}
                    index={idx}
                    onDropOver={moveQueue}
                    onAdvance={() => handleAdvanceStatus(order.id, order.status)}
                  />
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, product: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem' }}>
          {dialog.product ? 'Редактировать товар' : 'Новый товар'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Название *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Цена (₽) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={styles.noSpinner} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Склад (шт.)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={styles.noSpinner} />
            </Grid>

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
                  {form.category && !existingCategories.includes(form.category) && (
                    <MenuItem key="__current__" value={form.category}>{form.category}</MenuItem>
                  )}
                  {existingCategories.length > 0 && <Divider />}
                  <MenuItem value="__new__" sx={{ color: 'var(--accent)', fontWeight: 500 }}>
                    + Добавить категорию
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
              <Box sx={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-2)',
                mb: 1,
              }}>
                Доступные цвета
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {COLOR_CHOICES.map((hex) => {
                  const active = (form.colors || []).map((c) => c.toLowerCase()).includes(hex.toLowerCase());
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => toggleFormColor(hex)}
                      aria-pressed={active}
                      aria-label={`Цвет ${hex}`}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: hex, cursor: 'pointer', padding: 0,
                        border: '1px solid rgba(43,33,24,0.15)',
                        boxShadow: active ? '0 0 0 2px var(--bg), 0 0 0 3px var(--ink)' : 'none',
                      }}
                    />
                  );
                })}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-2)',
                mb: 1,
              }}>
                Изображение
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <Box sx={{
                  width: { xs: '100%', sm: 120 }, height: 120, flexShrink: 0,
                  border: '1px solid var(--rule-strong)',
                  overflow: 'hidden',
                  background: 'var(--surface-alt)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {form.image_url
                    ? <img src={mediaUrl(form.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Box sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>нет фото</Box>
                  }
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    disabled={imageUploading}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {imageUploading ? 'Загрузка…' : 'Загрузить файл'}
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </Button>
                  <TextField
                    fullWidth
                    size="small"
                    label="или вставьте URL"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialog({ open: false, product: null })}>Отмена</Button>
          <Button variant="contained" onClick={saveProduct}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, productId: null, productName: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem' }}>
          Удалить товар?
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ color: 'var(--text-2)', fontSize: '0.94rem' }}>
            Вы собираетесь удалить товар{' '}
            <strong style={{ color: 'var(--text)' }}>{deleteDialog.productName}</strong>.
            Это действие необратимо.
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteDialog({ open: false, productId: null, productName: '' })}>
            Отмена
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, orderId: null, reason: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem' }}>
          Отменить заказ №{cancelDialog.orderId}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
          <Box sx={{ color: 'var(--text-2)', fontSize: '0.94rem', mb: 2 }}>
            Это действие нельзя отменить. При необходимости укажите причину отмены.
          </Box>
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
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCancelDialog({ open: false, orderId: null, reason: '' })}>
            Назад
          </Button>
          <Button variant="contained" color="error" onClick={handleCancelOrder}>
            Отменить заказ
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// Draggable queue row. Uses native HTML5 DnD — works without external deps.
function QueueRow({ order, index, onDropOver, onAdvance }) {
  const [over, setOver] = useState(false);
  const onDragStart = (e) => {
    e.dataTransfer.setData('text/plain', String(order.id));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); };
  const onDragLeave = () => setOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setOver(false);
    const fromId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!Number.isFinite(fromId)) return;
    onDropOver(fromId, order.id);
  };

  const label = order.type === 'catalog'
    ? (order.items || []).map((i) => `${i.name} ×${i.quantity}`).join(' · ')
    : (order.custom_detail?.description || 'Индивидуальный заказ');

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`${styles.queueRow} ${over ? styles.queueRowOver : ''}`}
    >
      <div className={styles.queueHandle} aria-hidden>⋮⋮</div>
      <div className={styles.queuePos}>{String(index + 1).padStart(2, '0')}</div>
      <div className={styles.queueMain}>
        <div className={styles.queueTitle}>F-{String(order.id).padStart(5, '0')}</div>
        <div className={styles.queueBody}>{label}</div>
      </div>
      <div className={styles.queueClient}>{order.user_name || '—'}</div>
      <div className={styles.queueStatus}>
        {order.status === 'in_progress' ? 'В работе' : 'В очереди'}
      </div>
      {order.status === 'created' && (
        <button type="button" className={styles.queueAction} onClick={onAdvance}>
          Взять →
        </button>
      )}
    </li>
  );
}
