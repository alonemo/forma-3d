import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert } from '@mui/material';
import useOrderStore from '../../store/orderStore';
import useAuthStore from '../../store/authStore';
import DateField from '../../components/DateField/DateField';
import styles from './Order.module.css';

const MATERIALS = [
  { value: 'PLA',   rate: 1.0 },
  { value: 'PETG',  rate: 1.15 },
  { value: 'ABS',   rate: 1.2 },
  { value: 'Nylon', rate: 1.55 },
  { value: 'TPU',   rate: 1.4 },
  { value: 'Resin', rate: 1.8 },
];

const INFO = [
  ['Сроки',     'Простые — 1–3 дня. Средние — 3–7 дней. Сложные — 7–14 дней после согласования.'],
  ['Ценообразование', 'Зависит от объёма, материала и сложности. Минимальный заказ — 300 ₽. Скидки от 5 штук.'],
  ['Ограничения FDM','Макс. размер: 300×300×400 мм. Для больших изделий — сборка из частей.'],
  ['Ограничения SLA','Макс. размер: 190×120×250 мм. Детализация 0.025 мм.'],
  ['Доставка',  'СДЭК, Почта России, курьер по Москве. Самовывоз бесплатный.'],
];

function parseVolume(sizeStr) {
  if (!sizeStr) return null;
  const nums = sizeStr.match(/\d+[.,]?\d*/g);
  if (!nums || nums.length < 3) return null;
  const [a, b, c] = nums.slice(0, 3).map((n) => parseFloat(n.replace(',', '.')));
  if (!a || !b || !c) return null;
  return a * b * c;
}

function estimateRange(sizeStr, materialValue) {
  const volume = parseVolume(sizeStr);
  if (!volume) return null;
  const mat = MATERIALS.find((m) => m.value === materialValue);
  const rate = mat?.rate ?? 1.0;
  const densityFactor = 0.4;
  const massG = (volume / 1000) * densityFactor;
  const base = Math.max(300, Math.round(massG * 12 * rate));
  const low = Math.round(base / 50) * 50;
  const high = Math.round(base * 1.8 / 50) * 50;
  return { low, high };
}

export default function Order() {
  const { submitCustomOrder, loading } = useOrderStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    description: '', dimensions: '', material: '', contact_phone: '', desired_deadline: '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const estimate = useMemo(
    () => estimateRange(form.dimensions, form.material),
    [form.dimensions, form.material]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setError('');
    const result = await submitCustomOrder(form);
    if (result.success) setSuccess(true);
    else setError(result.message);
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.successEyebrow}>Заявка #{Math.floor(Math.random() * 9000) + 1000}</div>
          <h1 className={styles.successTitle}>Заявка отправлена!</h1>
          <p className={styles.successText}>
            Мы получили вашу заявку и свяжемся в&nbsp;течение часа по&nbsp;указанному телефону.
            Статус можно отслеживать в&nbsp;<a onClick={() => navigate('/profile')}>личном кабинете</a>.
          </p>
          <div className={styles.successActions}>
            <Button variant="outlined" onClick={() => {
              setSuccess(false);
              setForm({ description: '', dimensions: '', material: '', contact_phone: '', desired_deadline: '' });
            }}>
              Ещё одну заявку
            </Button>
            <Button variant="contained" onClick={() => navigate('/profile')}>
              В кабинет →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroNum}>Индивидуальный заказ</div>
        <div>
          <h1 className={styles.heroTitle}>Заказать изделие</h1>
          <p className={styles.heroLead}>
            Опишите, что нужно напечатать — мы рассчитаем стоимость и&nbsp;согласуем
            материал. Бесплатная консультация, ответ в&nbsp;течение часа.
          </p>
        </div>
      </section>

      <div className={styles.body}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {!user && (
            <Alert severity="info" className={styles.authAlert}>
              Для отправки заявки необходимо{' '}
              <a onClick={() => navigate('/login')}>войти в аккаунт</a>.
            </Alert>
          )}

          {error && <Alert severity="error" className={styles.authAlert}>{error}</Alert>}

          <div className={styles.stepBlock}>
            <div className={styles.stepNum}>01</div>
            <div>
              <div className={styles.stepLabel}>Описание изделия</div>
              <div className={styles.stepHint}>
                Опишите назначение, требования к&nbsp;прочности и&nbsp;внешнему виду.
                Ссылки на&nbsp;референсы — приветствуются.
              </div>
              <textarea
                className={styles.nakedTextarea}
                placeholder="Опишите, что нужно изготовить — назначение, особенности, требования к материалу…"
                value={form.description}
                onChange={set('description')}
                required
              />
            </div>
          </div>

          <div className={styles.stepBlock}>
            <div className={styles.stepNum}>02</div>
            <div>
              <div className={styles.stepLabel}>Габариты</div>
              <div className={styles.stepHint}>
                Укажите размеры в&nbsp;формате Д×Ш×В, мм. Примерный размер тоже подойдёт.
              </div>
              <input
                className={styles.nakedInput}
                placeholder="100×50×30 мм"
                value={form.dimensions}
                onChange={set('dimensions')}
              />
            </div>
          </div>

          <div className={styles.stepBlock}>
            <div className={styles.stepNum}>03</div>
            <div>
              <div className={styles.stepLabel}>Материал</div>
              <div className={styles.stepHint}>
                Не знаете — оставьте пустым, подскажем после получения заявки.
              </div>
              <div className={styles.materialChoice}>
                {MATERIALS.map((m) => (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => setForm((f) => ({ ...f, material: f.material === m.value ? '' : m.value }))}
                    className={`${styles.materialOption} ${form.material === m.value ? styles.materialOptionActive : ''}`}
                  >
                    {m.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.stepBlock}>
            <div className={styles.stepNum}>04</div>
            <div>
              <div className={styles.stepLabel}>Контакты и сроки</div>
              <div className={styles.stepHint}>
                Менеджер позвонит по&nbsp;этому телефону. Желаемый срок необязателен.
              </div>
              <div className={`${styles.inputRow} ${styles.inputRow2}`}>
                <input
                  className={styles.nakedInput}
                  placeholder="+7 (___) ___-__-__"
                  value={form.contact_phone}
                  onChange={set('contact_phone')}
                />
                <DateField
                  value={form.desired_deadline}
                  onChange={set('desired_deadline')}
                />
              </div>
            </div>
          </div>

          <div className={styles.submitRow}>
            <Button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !form.description}
            >
              {loading ? 'Отправка…' : 'Отправить заявку →'}
            </Button>
          </div>
        </form>

        <aside className={styles.sidebar}>
          <div className={styles.summary}>
            <div className={styles.summaryTitle}>Ваш заказ / сводка</div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Описание</span>
              <span className={form.description ? styles.summaryVal : `${styles.summaryVal} ${styles.summaryValMuted}`}>
                {form.description ? truncate(form.description, 80) : '—'}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Габариты</span>
              <span className={form.dimensions ? styles.summaryVal : `${styles.summaryVal} ${styles.summaryValMuted}`}>
                {form.dimensions || '—'}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Материал</span>
              <span className={form.material ? styles.summaryVal : `${styles.summaryVal} ${styles.summaryValMuted}`}>
                {form.material || 'подскажем'}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Срок</span>
              <span className={form.desired_deadline ? styles.summaryVal : `${styles.summaryVal} ${styles.summaryValMuted}`}>
                {form.desired_deadline ? formatDeadline(form.desired_deadline) : 'без ограничений'}
              </span>
            </div>

            <div className={styles.estimate}>
              <div className={styles.estimateLabel}>Ориентировочно</div>
              <div className={styles.estimateValue}>
                {estimate
                  ? `${estimate.low.toLocaleString('ru-RU')}–${estimate.high.toLocaleString('ru-RU')} ₽`
                  : 'от 300 ₽'}
              </div>
              <div className={styles.estimateNote}>
                {estimate
                  ? 'Расчёт приблизительный. Точная цена — после согласования.'
                  : 'Укажите габариты — покажем предварительный диапазон.'}
              </div>
            </div>
          </div>

          <div className={styles.infoList}>
            {INFO.map(([key, val]) => (
              <div key={key} className={styles.infoItem}>
                <div className={styles.infoKey}>{key}</div>
                <div className={styles.infoVal}>{val}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n).trimEnd() + '…' : str;
}

function formatDeadline(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}
