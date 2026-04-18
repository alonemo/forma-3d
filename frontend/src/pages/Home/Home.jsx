import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { getProductsApi } from '../../api/products';
import ProductCard from '../../components/ProductCard/ProductCard';
import styles from './Home.module.css';

const HERO_META = [
  { label: 'Принтеров',       value: '8 станков' },
  { label: 'Работ выполнено', value: '3 412' },
  { label: 'Средний срок',    value: '4–7 дней' },
];

const TICKER = [
  ['PLA из кукурузы', false],
  ['фотополимерная смола 25 мкм', true],
  ['филамент с древесным волокном', false],
  ['PETG — прочный и пищевой', true],
  ['ручная пост-обработка', false],
  ['печать по вашим моделям', true],
];

const PROCESS = [
  { n: '01', tag: 'Выбор',       title: 'Модель и цвет',   desc: 'Выберите готовое изделие в каталоге или загрузите свой STL. 6 цветов, 4 материала в наличии.' },
  { n: '02', tag: 'Печать',      title: 'На одном станке', desc: 'Каждый заказ — это конкретный принтер и конкретная катушка. Вы видите статус в реальном времени.' },
  { n: '03', tag: 'Обработка',   title: 'Руки мастера',    desc: 'Удаление опор, шлифовка кромок, при необходимости — грунтовка и покраска акрилом.' },
  { n: '04', tag: 'Доставка',    title: '3–7 дней',        desc: 'СДЭК, Почта России, курьер по Москве. Упаковываем в крафт с деревянной стружкой.' },
];

const TOTAL_LAYERS = 960;
const START_LAYER = 614;

function HeroVisual() {
  const layers = 58;
  const layerHeight = 2.6;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1800);
    return () => clearInterval(t);
  }, []);

  // cycles layer count between START_LAYER and TOTAL_LAYERS−2, then wraps
  const span = TOTAL_LAYERS - 2 - START_LAYER;
  const layerNow = START_LAYER + (tick * 2) % Math.max(span, 1);
  const percent = ((layerNow / TOTAL_LAYERS) * 100).toFixed(1);

  return (
    <div className={styles.heroVisual}>
      <div className={styles.visualOverlay}>
        <span><span className={styles.visualDot} />ПЕЧАТАЕТСЯ СЕЙЧАС</span>
        <span>FM-001 · PLA · 0.2 MM</span>
      </div>
      <div className={styles.printerViz}>
        <div className={styles.printerStage}>
          <div className={styles.printerGantry} />
          <div className={styles.printheadRail} />
          <div className={styles.printhead} />
          <div className={styles.vase}>
            {Array.from({ length: layers }).map((_, i) => {
              const t = i / (layers - 1);
              const curve = 0.55 + Math.sin(t * Math.PI * 0.95) * 0.4 + Math.sin(t * Math.PI * 2.4) * 0.06;
              const w = 60 + curve * 110;
              return (
                <div
                  key={i}
                  className={styles.vaseLayer}
                  style={{
                    bottom: `${i * layerHeight}px`,
                    width: `${w}px`,
                    opacity: 0.96 - (i % 2) * 0.08,
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              );
            })}
          </div>
          <div className={styles.printerBase} />
        </div>
      </div>
      <div className={styles.visualCaption}>
        <span>Ваза «Слой» №73</span>
        <span>
          <span className={styles.visualCaptionLive}>
            {percent}%
            <span className={styles.visualCaret}>_</span>
          </span>
          {' · '}
          {layerNow}/{TOTAL_LAYERS} слоёв
        </span>
      </div>
    </div>
  );
}

// Reveal-on-scroll hook. Re-observes across observer recreation so that
// StrictMode's double-mount doesn't leave elements stuck at opacity 0.
function useReveal() {
  const observerRef = useRef(null);
  const targetsRef = useRef(new Set());

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add(styles.visible);
          obs.unobserve(e.target);
          targetsRef.current.delete(e.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observerRef.current = obs;
    targetsRef.current.forEach((el) => obs.observe(el));
    return () => {
      obs.disconnect();
      observerRef.current = null;
    };
  }, []);

  return (el) => {
    if (!el || targetsRef.current.has(el)) return;
    if (el.classList.contains(styles.visible)) return;
    targetsRef.current.add(el);
    if (observerRef.current) observerRef.current.observe(el);
  };
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const addRef = useReveal();

  useEffect(() => {
    getProductsApi({ limit: 8 })
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : (r.data?.items || [])))
      .catch(() => setProducts([]));
  }, []);

  const bestsellers = products.slice(0, 4);
  const newInWorkshop = products.slice(4, 8);

  const openProduct = (p) => navigate(`/catalog/${p.id}`);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroLayout}>
            <div className={styles.heroContent}>
              <div className="eyebrow" style={{ marginBottom: 32 }}>
                ↳ Студия 3D-печати · Москва · с 2019
              </div>
              <h1 className={styles.heroTitle}>
                Вещи, собранные<br />
                <em>слой за&nbsp;слоем</em>,<br />
                руками мастера.
              </h1>
              <p className={styles.heroDescription}>
                ФОРМА — небольшая мастерская. Каждое изделие проходит
                через конкретный принтер, конкретную катушку и&nbsp;руки
                мастера — от&nbsp;первой линии до&nbsp;финальной шлифовки.
              </p>
              <div className={styles.heroCta}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/catalog')}
                >
                  Смотреть каталог →
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/order')}
                >
                  Заказать изделие
                </Button>
              </div>
            </div>
            <HeroVisual />
          </div>
          <div className={styles.heroMetaRow}>
            <div className={styles.heroMeta}>
              {HERO_META.map((m) => (
                <div key={m.label}>
                  <div className={styles.heroMetaLabel}>{m.label}</div>
                  <div className={styles.heroMetaValue}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── TICKER ───────────── */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {[0, 1].map((k) => (
            <React.Fragment key={k}>
              {TICKER.map(([text, emph], i) => (
                <React.Fragment key={`${k}-${i}`}>
                  <span className={styles.tickerItem}>
                    {emph ? <em>{text}</em> : text}
                  </span>
                  <span className={styles.tickerSep}>◆</span>
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ───────────── PHILOSOPHY + PROCESS ───────────── */}
      <section className={styles.philosophy}>
        <div className={styles.container}>
          <div ref={addRef} className={`${styles.philosophyGrid} ${styles.observe}`}>
            <div className={styles.philosophyLabel}>Подход</div>
            <div className={styles.philosophyText}>
              Мы не прячем слои печати. <em>Они и есть фактура.</em> Как гончар
              не прячет следы пальцев на глине, мы оставляем видимыми кольца,
              по которым сопло укладывало материал час за часом.
            </div>
          </div>

          <div className={styles.process}>
            {PROCESS.map((p, i) => (
              <div
                key={p.n}
                ref={addRef}
                className={`${styles.processStep} ${styles.observe}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={styles.processNum}>{p.n} / {p.tag}</div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── BESTSELLERS / NEW ───────────── */}
      <section className={styles.bestsellers}>
        <div className={styles.container}>
          <div ref={addRef} className={`${styles.sectionHead} ${styles.observe}`}>
            <h2>Часто <em>печатают.</em></h2>
            <div className={styles.sectionSub}>
              Бестселлеры<br />
              Апрель 2026
            </div>
          </div>

          {bestsellers.length > 0 ? (
            <div className={styles.grid}>
              {bestsellers.map((p, i) => (
                <div
                  key={p.id}
                  ref={addRef}
                  className={styles.observe}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProductCard product={p} onOpen={openProduct} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.gridPlaceholder}>Каталог загружается…</div>
          )}

          {newInWorkshop.length > 0 && (
            <>
              <div ref={addRef} className={`${styles.sectionHead} ${styles.observe}`} style={{ marginTop: 100 }}>
                <h2>Новое в&nbsp;<em>мастерской.</em></h2>
                <div className={styles.sectionSub}>
                  Свежие работы<br />
                  <button
                    className={styles.linkBtn}
                    onClick={() => navigate('/catalog')}
                  >
                    Весь каталог →
                  </button>
                </div>
              </div>
              <div className={styles.grid}>
                {newInWorkshop.map((p, i) => (
                  <div
                    key={p.id}
                    ref={addRef}
                    className={styles.observe}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <ProductCard product={p} onOpen={openProduct} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
