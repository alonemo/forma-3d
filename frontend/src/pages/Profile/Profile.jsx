import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import useAuthStore from '../../store/authStore';
import useOrderStore from '../../store/orderStore';
import useCartStore from '../../store/cartStore';
import ProductForm from '../../components/ProductForm/ProductForm';
import { noun, formatDate, orderIdFmt } from '../../utils/format';
import styles from './Profile.module.css';

const STATUS_LABEL = {
  created:     'В очереди',
  in_progress: 'Печатается',
  ready:       'Готово',
  cancelled:   'Отменён',
};

const STATUS_CLASS = {
  created:     'statusQueued',
  in_progress: 'statusPrinting',
  ready:       'statusReady',
  cancelled:   'statusCancelled',
};

// Synthetic print specs from price (no DB columns for layers/time)
function printSpecs(order) {
  const total = parseFloat(order.total_price) || 1;
  const layers = Math.max(200, Math.round(total / 2.8));
  const printerNum = String((order.id % 4) + 1).padStart(2, '0');
  const printerModel = ['Prusa MK4S', 'Bambu X1C', 'Elegoo Saturn', 'Creality K2'][order.id % 4];
  return {
    totalLayers: layers,
    printer: `${printerModel} #${printerNum}`,
  };
}

export default function Profile() {
  const { user, logout, updateMe } = useAuthStore();
  const { orders, fetchUserOrders, cancelUserOrder, loading } = useOrderStore();
  const { addItem, toggleDrawer } = useCartStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState('orders');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [tick, setTick] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { fetchUserOrders(); }, []);

  // Live progress tick — drives synthetic layer counter for in_progress orders
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1800);
    return () => clearInterval(t);
  }, []);

  if (!user) return null;

  const activeOrders  = orders.filter((o) => o.status === 'created' || o.status === 'in_progress');
  const pastOrders    = orders.filter((o) => o.status === 'ready' || o.status === 'cancelled');
  const printingCount = orders.filter((o) => o.status === 'in_progress').length;
  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled' && o.total_price)
    .reduce((s, o) => s + parseFloat(o.total_price), 0);

  const oldest = useMemo(() => {
    if (!orders.length) return null;
    return orders.reduce((a, b) => new Date(a.created_at) < new Date(b.created_at) ? a : b);
  }, [orders]);

  const clientSince = oldest ? formatDate(new Date(oldest.created_at)) : '—';
  const avatarLetter = (user.name?.[0] || '?').toUpperCase();

  const handleCancel = async () => {
    if (!confirmCancel) return;
    await cancelUserOrder(confirmCancel);
    setConfirmCancel(null);
  };

  const openEdit = () => {
    setEditForm({ name: user.name || '', email: user.email || '' });
    setEditError('');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditError('');
    setEditSaving(true);
    const ok = await updateMe(editForm.name, editForm.email);
    setEditSaving(false);
    if (ok) setEditOpen(false);
    else setEditError(useAuthStore.getState().error || 'Не удалось сохранить');
  };

  const handleRepeat = (order) => {
    if (order.type !== 'catalog' || !order.items?.length) return;
    order.items.forEach((item) => {
      addItem({
        id: item.product_id ?? item.name,
        name: item.name,
        price: item.price,
        stock: 99,
        category: item.category,
        material: item.material,
      }, item.quantity || 1);
    });
    toggleDrawer(true);
  };

  // Synthetic live progress for printing orders (between 35% and 95%)
  const liveFor = (order) => {
    const { totalLayers, printer } = printSpecs(order);
    if (order.status !== 'in_progress') {
      return {
        progress: order.status === 'ready' ? 100 : 0,
        curLayer: order.status === 'ready' ? totalLayers : 0,
        totalLayers,
        printer,
      };
    }
    const basePct = 35 + ((order.id * 13) % 45); // deterministic per-order starting point
    const pct = Math.min(95, basePct + (tick * 0.3) % 60);
    return {
      progress: pct,
      curLayer: Math.floor(totalLayers * (pct / 100)),
      totalLayers,
      printer,
    };
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.layout}>

          {/* ─────────── Sidebar ─────────── */}
          <aside className={styles.nav}>
            <div className={styles.eyebrow}>Личный кабинет</div>
            <ul className={styles.navList}>
              <li>
                <button
                  type="button"
                  className={`${styles.navBtn} ${tab === 'orders' ? styles.navBtnActive : ''}`}
                  onClick={() => setTab('orders')}
                >
                  <span>Текущие заказы</span>
                  <span className={styles.navBadge}>{activeOrders.length}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`${styles.navBtn} ${tab === 'history' ? styles.navBtnActive : ''}`}
                  onClick={() => setTab('history')}
                >
                  <span>История</span>
                  <span className={styles.navBadge}>{pastOrders.length}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`${styles.navBtn} ${tab === 'addresses' ? styles.navBtnActive : ''}`}
                  onClick={() => setTab('addresses')}
                >
                  <span>Адреса</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`${styles.navBtn} ${tab === 'profile' ? styles.navBtnActive : ''}`}
                  onClick={() => setTab('profile')}
                >
                  <span>Профиль</span>
                </button>
              </li>
              {user.role === 'admin' && (
                <li style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={() => navigate('/admin')}
                  >
                    <span>Админ-панель →</span>
                  </button>
                </li>
              )}
              <li style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className={styles.navLogout}
                  onClick={() => { logout(); navigate('/'); }}
                >
                  Выйти
                </button>
              </li>
            </ul>
          </aside>

          {/* ─────────── Main ─────────── */}
          <div className={styles.main}>
            <div className={styles.header}>
              <div className={styles.avatar}>{avatarLetter}</div>
              <div>
                <div className={styles.name}>{user.name}</div>
                <div className={styles.email}>
                  {user.email}
                  {oldest && <> · клиент с&nbsp;{clientSince}</>}
                </div>
              </div>
              <Button
                variant="contained"
                onClick={() => navigate('/order')}
                sx={{ alignSelf: 'center' }}
              >
                Новый заказ →
              </Button>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statCell}>
                <div className={styles.statKey}>Заказов всего</div>
                <div className={styles.statValue}>{orders.length}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statKey}>Сейчас печатается</div>
                <div className={styles.statValue}>
                  {printingCount}
                  {orders.length > 0 && <em> из {orders.length}</em>}
                </div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statKey}>Всего потрачено</div>
                <div className={styles.statValue}>
                  {totalSpent > 0 ? totalSpent.toLocaleString('ru-RU') : '—'}
                  {totalSpent > 0 && <em>₽</em>}
                </div>
              </div>
            </div>

            {/* ─────────── Tab: Active orders ─────────── */}
            {tab === 'orders' && (
              <>
                <h2 className={styles.tabTitle}>Текущие заказы</h2>
                {loading ? (
                  <div>
                    {[0, 1].map((i) => (
                      <Skeleton key={i} variant="rectangular" height={200} sx={{ mb: 2.5, borderRadius: '4px' }} />
                    ))}
                  </div>
                ) : activeOrders.length === 0 ? (
                  <div className={styles.empty}>
                    <h3>Активных заказов нет.</h3>
                    <p>Оформите заказ из каталога — он появится здесь со статусом в реальном времени.</p>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/catalog')}
                      sx={{ mt: 2 }}
                    >
                      В каталог →
                    </Button>
                  </div>
                ) : (
                  activeOrders.map((order, idx) => {
                    const live = liveFor(order);
                    return (
                      <ActiveOrderCard
                        key={order.id}
                        order={order}
                        live={live}
                        delay={idx * 60}
                        onCancel={() => setConfirmCancel(order.id)}
                      />
                    );
                  })
                )}
              </>
            )}

            {/* ─────────── Tab: History ─────────── */}
            {tab === 'history' && (
              <>
                <h2 className={styles.tabTitle}>История</h2>
                {pastOrders.length === 0 ? (
                  <div className={styles.empty}>
                    <h3>История пуста.</h3>
                    <p>Завершённые и отменённые заказы появятся здесь.</p>
                  </div>
                ) : (
                  pastOrders.map((order, idx) => (
                    <HistoryOrderCard
                      key={order.id}
                      order={order}
                      delay={idx * 60}
                      onRepeat={() => handleRepeat(order)}
                    />
                  ))
                )}
              </>
            )}

            {/* ─────────── Tab: Addresses ─────────── */}
            {tab === 'addresses' && (
              <>
                <h2 className={styles.tabTitle}>Адреса</h2>
                <div className={styles.orderCard}>
                  <div className={styles.eyebrow} style={{ marginBottom: 8 }}>Адрес по умолчанию</div>
                  <div className={styles.addressName}>Дом</div>
                  <p className={styles.addressText}>
                    Москва, ул.&nbsp;Марата, д.&nbsp;14, кв.&nbsp;23
                  </p>
                  <p className={styles.addressPhone}>+7 (921) 555-04-12</p>
                  <Button variant="text" size="small" sx={{ mt: 1, pl: 0 }}>
                    + Добавить адрес
                  </Button>
                </div>
              </>
            )}

            {/* ─────────── Tab: Profile ─────────── */}
            {tab === 'profile' && (
              <>
                <h2 className={styles.tabTitle}>Профиль</h2>
                <div className={styles.orderCard} style={{ maxWidth: 560 }}>
                  <div className={styles.eyebrow} style={{ marginBottom: 16 }}>Данные аккаунта</div>
                  {[
                    ['Имя',   user.name],
                    ['Email', user.email],
                    ['Клиент с', clientSince],
                  ].map(([k, v]) => (
                    <div className={styles.profileRow} key={k}>
                      <span className={styles.profileKey}>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  <Button variant="outlined" size="small" sx={{ mt: 2.5 }} onClick={openEdit}>
                    Редактировать
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>
          Редактировать профиль
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Имя"
            fullWidth
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            disabled={editSaving}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            disabled={editSaving}
          />
          {editError && (
            <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 8 }}>{editError}</div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setEditOpen(false)} disabled={editSaving}>
            Отмена
          </Button>
          <Button variant="contained" onClick={saveEdit} disabled={editSaving}>
            {editSaving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>
          Отменить заказ {confirmCancel && orderIdFmt(confirmCancel)}?
        </DialogTitle>
        <DialogContent>
          <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
            Заказ будет отменён. Если печать уже началась — продолжится только постобработка.
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setConfirmCancel(null)}>
            Оставить
          </Button>
          <Button variant="contained" color="error" onClick={handleCancel}>
            Отменить заказ
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function ActiveOrderCard({ order, live, delay = 0, onCancel }) {
  const isPrinting = order.status === 'in_progress';
  const isQueued = order.status === 'created';

  return (
    <div className={styles.orderCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.orderHead}>
        <div>
          <div className={styles.orderId}>ЗАКАЗ {orderIdFmt(order.id)}</div>
          <div className={styles.orderDate}>Размещён {formatDate(new Date(order.created_at))}</div>
        </div>
        <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[order.status]]}`}>
          <span className={styles.statusDot} />
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <OrderItems order={order} />

      {isPrinting && (
        <div className={styles.printProgress}>
          <div className={styles.progressHead}>
            <span className={styles.progressStage}>▲ Печать слоёв</span>
            <span className={styles.progressEta}>
              Слой <span className={styles.mono}>{live.curLayer}</span> / <span className={styles.mono}>{live.totalLayers}</span>
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${live.progress}%` }} />
          </div>
          <div className={styles.progressMeta}>
            <span>{live.printer}</span>
            <span className={styles.mono}>{live.progress.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {isQueued && (
        <div className={styles.printProgress}>
          <div className={styles.progressHead}>
            <span className={styles.progressStageMuted}>◷ В очереди</span>
            <span className={styles.progressEta}>Ориентировочно 1–2 дня</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={`${styles.progressFill} ${styles.progressFillMuted}`} style={{ width: '0%' }} />
          </div>
          <div className={styles.progressMeta}>
            <span>Ожидает назначения принтера</span>
            <span className={styles.mono}>0.0%</span>
          </div>
        </div>
      )}

      <div className={styles.orderFoot}>
        <div className={styles.orderTotal}>
          <span className={styles.orderTotalKey}>Сумма</span>
          <span className={styles.mono}>
            {order.total_price
              ? parseFloat(order.total_price).toLocaleString('ru-RU') + ' ₽'
              : '—'}
          </span>
        </div>
        {isQueued && (
          <Button variant="text" size="small" color="error" onClick={onCancel}>
            Отменить
          </Button>
        )}
      </div>
    </div>
  );
}

function HistoryOrderCard({ order, delay = 0, onRepeat }) {
  const isCancelled = order.status === 'cancelled';
  return (
    <div className={styles.orderCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.orderHead}>
        <div>
          <div className={styles.orderId}>ЗАКАЗ {orderIdFmt(order.id)}</div>
          <div className={styles.orderDate}>{formatDate(new Date(order.created_at))}</div>
        </div>
        <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[order.status]]}`}>
          <span className={styles.statusDot} />
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <OrderItems order={order} />

      {isCancelled && order.cancel_reason && (
        <div className={styles.cancelReason}>Причина: {order.cancel_reason}</div>
      )}

      <div className={styles.orderFoot}>
        <div className={styles.orderTotal}>
          <span className={styles.orderTotalKey}>Сумма</span>
          <span className={styles.mono}>
            {order.total_price
              ? parseFloat(order.total_price).toLocaleString('ru-RU') + ' ₽'
              : '—'}
          </span>
        </div>
        {order.type === 'catalog' && !isCancelled && (
          <Button variant="text" size="small" onClick={onRepeat}>
            Повторить заказ →
          </Button>
        )}
      </div>
    </div>
  );
}

function OrderItems({ order }) {
  if (order.type === 'custom' && order.custom_detail) {
    return (
      <div className={styles.customOrderBody}>
        <div className={styles.customOrderLabel}>Индивидуальный заказ</div>
        <p className={styles.customOrderText}>{order.custom_detail.description}</p>
      </div>
    );
  }
  if (!order.items?.length) {
    return <div className={styles.customOrderText} style={{ padding: '12px 0' }}>Состав заказа недоступен</div>;
  }
  return (
    <div className={styles.orderItems}>
      {order.items.map((item, idx) => {
        const syntheticProduct = {
          id: item.product_id ?? (item.name?.charCodeAt(0) || idx),
          name: item.name,
          category: item.category,
          material: item.material,
          image_url: item.image_url,
        };
        return (
          <div className={styles.orderItem} key={`${item.name}-${idx}`}>
            <div className={styles.orderThumb}>
              <ProductForm product={syntheticProduct} />
              {item.quantity > 1 && (
                <span className={styles.orderThumbQty}>×{item.quantity}</span>
              )}
            </div>
            <div>
              <div className={styles.orderItemName}>{item.name}</div>
              <div className={styles.orderItemMeta}>
                {item.material ? item.material : `${noun(item.quantity || 1, ['шт.', 'шт.', 'шт.'])}`}
                {item.material && item.quantity > 1 && ` · ×${item.quantity}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
