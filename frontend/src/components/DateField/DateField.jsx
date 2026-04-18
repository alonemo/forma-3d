import React, { useEffect, useRef, useState } from 'react';
import styles from './DateField.module.css';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function parseIso(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(date) ? null : date;
}

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatRu(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}

function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) {
    cells.push({ day: daysInPrev - offset + 1 + i, muted: true, date: new Date(year, month - 1, daysInPrev - offset + 1 + i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, muted: false, date: new Date(year, month, d) });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const nextDay = cells.length - offset - daysInMonth + 1;
    cells.push({ day: nextDay, muted: true, date: new Date(year, month + 1, nextDay) });
    if (cells.length >= 42) break;
  }
  return cells;
}

export default function DateField({ value, onChange, placeholder = 'дд.мм.гггг', minDate, id }) {
  const parsed = parseIso(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((parsed || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((parsed || today).getMonth());
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (date) => {
    onChange({ target: { value: toIso(date) } });
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const clear = () => {
    onChange({ target: { value: '' } });
    setOpen(false);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    select(today);
  };

  const cells = buildGrid(viewYear, viewMonth);
  const minDateObj = minDate ? parseIso(minDate) : null;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={parsed ? styles.triggerValue : styles.triggerPlaceholder}>
          {parsed ? formatRu(parsed) : placeholder}
        </span>
        <span className={styles.triggerIcon} aria-hidden>▾</span>
      </button>

      {open && (
        <div className={styles.popover} role="dialog" aria-label="Выбор даты">
          <div className={styles.popHead}>
            <button type="button" className={styles.navBtn} onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">←</button>
            <div className={styles.title}>
              <span className={styles.titleMonth}>{MONTHS[viewMonth]}</span>
              <span className={styles.titleYear}>{viewYear}</span>
            </div>
            <button type="button" className={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Следующий месяц">→</button>
          </div>

          <div className={styles.weekRow}>
            {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
          </div>

          <div className={styles.grid}>
            {cells.map((c, i) => {
              const isToday = sameDay(c.date, today);
              const isSelected = parsed && sameDay(c.date, parsed);
              const disabled = minDateObj && c.date < minDateObj;
              const cls = [
                styles.cell,
                c.muted && styles.cellMuted,
                isToday && styles.cellToday,
                isSelected && styles.cellSelected,
                disabled && styles.cellDisabled,
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  onClick={() => !disabled && select(c.date)}
                  disabled={disabled}
                >
                  {c.day}
                </button>
              );
            })}
          </div>

          <div className={styles.popFoot}>
            <button type="button" className={styles.footBtn} onClick={clear}>Сбросить</button>
            <button type="button" className={styles.footBtn} onClick={goToday}>Сегодня</button>
          </div>
        </div>
      )}
    </div>
  );
}
