import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Grid, Typography, Button, Box, Chip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import styles from './Home.module.css';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 6 + 2,
  left: Math.random() * 100,
  delay: Math.random() * 12,
  duration: Math.random() * 12 + 10,
}));

const FEATURES = [
  { icon: '⚡', color: '#00e5ff', bg: 'rgba(0,229,255,0.1)', title: 'Быстрое изготовление', desc: 'Стандартные изделия готовы за 1–3 дня. Сложные модели — до 7 дней с момента согласования.' },
  { icon: '🎯', color: '#7c4dff', bg: 'rgba(124,77,255,0.1)', title: 'Точность до 0.1 мм', desc: 'Используем профессиональное оборудование FDM и SLA классов, обеспечивая высокую точность деталей.' },
  { icon: '🌈', color: '#ff6d00', bg: 'rgba(255,109,0,0.1)', title: 'Более 40 материалов', desc: 'PLA, PETG, ABS, TPU, Nylon, фотополимеры и специальные смеси для любых задач.' },
  { icon: '🔧', color: '#00e676', bg: 'rgba(0,230,118,0.1)', title: 'Постобработка', desc: 'Шлифовка, покраска, склейка, гальваника — доведём изделие до готового продукта.' },
  { icon: '💡', color: '#ffab40', bg: 'rgba(255,171,64,0.1)', title: 'Консультация', desc: 'Поможем выбрать материал и технологию под вашу задачу. Бесплатно.' },
  { icon: '📦', color: '#e040fb', bg: 'rgba(224,64,251,0.1)', title: 'Доставка по России', desc: 'СДЭК, Почта России, курьер по Москве. Упаковка исключает повреждения.' },
];

const STEPS = [
  { n: '01', title: 'Оставьте заявку', desc: 'Опишите идею или прикрепите ссылку на референс. Заполните форму на сайте — это займёт 2 минуты.' },
  { n: '02', title: 'Согласование', desc: 'Наш менеджер свяжется с вами в течение часа, уточнит детали и рассчитает стоимость.' },
  { n: '03', title: 'Производство', desc: 'Запускаем печать после предоплаты. Отправляем фото промежуточного результата.' },
  { n: '04', title: 'Получение', desc: 'Заберите сами или закажите доставку. Гарантия качества на каждое изделие.' },
];

const MATERIALS = [
  { name: 'PLA', emoji: '🌿', color: '#00e5ff', desc: 'Экологичный, лёгкий в печати, отличная детализация' },
  { name: 'PETG', emoji: '💎', color: '#7c4dff', desc: 'Прочный, гибкий, устойчив к температурам' },
  { name: 'ABS', emoji: '🔩', color: '#ff6d00', desc: 'Термостойкий, подходит для механических деталей' },
  { name: 'Resin', emoji: '✨', color: '#e040fb', desc: 'Максимальная детализация для фигурок и прототипов' },
];

export default function Home() {
  const navigate = useNavigate();
  const observeRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
      { threshold: 0.15 }
    );
    observeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addObserveRef = (el) => {
    if (el && !observeRefs.current.includes(el)) observeRefs.current.push(el);
  };

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.particles}>
          {PARTICLES.map((p) => (
            <div key={p.id} className={styles.particle} style={{
              width: p.size, height: p.size,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }} />
          ))}
        </div>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <div className={styles.heroContent}>
                <div className={styles.heroTag}>
                  <span className={styles.heroTagDot} />
                  Профессиональная 3D-печать
                </div>

                <Typography
                  variant="h1"
                  className={styles.heroTitle}
                  sx={{ mb: 3, fontSize: { xs: 'clamp(2rem, 9vw, 2.6rem)', sm: 'clamp(2.4rem, 5vw, 3.6rem)', md: 'clamp(2.8rem, 5vw, 5rem)' } }}
                >
                  Воплощаем<br />
                  <span className={styles.gradientText}>идеи в реальность</span>
                </Typography>

                <Typography className={styles.heroSub} sx={{ mb: 4 }}>
                  Изготовим любое изделие по вашему заказу: прототипы, декор, запчасти,
                  подарки. Точность до 0.1 мм, более 40 материалов.
                </Typography>

                <div className={styles.heroActions} style={{ marginBottom: 48 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/order')}
                    sx={{ fontSize: '1rem', px: 4, py: 1.5 }}
                  >
                    Заказать изделие
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/catalog')}
                    sx={{ fontSize: '1rem', px: 4, py: 1.5, borderColor: 'rgba(255,255,255,0.15)', color: '#e8e8f0', '&:hover': { borderColor: '#00e5ff', color: '#00e5ff', background: 'rgba(0,229,255,0.05)' } }}
                  >
                    Смотреть каталог
                  </Button>
                </div>

                <div className={styles.stats}>
                  {[['500+', 'Выполненных заказов'], ['40+', 'Материалов'], ['0.1 мм', 'Точность'], ['1–3 дня', 'Срок изготовления']].map(([n, l]) => (
                    <div key={l} className={styles.statItem}>
                      <div className={styles.statNum}>{n}</div>
                      <div className={styles.statLabel}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <div className={styles.cubeScene}>
                <div className={styles.cubeGlow} />
                <div className={styles.cube}>
                  <div className={`${styles.cubeFace} ${styles.front}`}>🖨️</div>
                  <div className={`${styles.cubeFace} ${styles.back}`}>⚙️</div>
                  <div className={`${styles.cubeFace} ${styles.left}`}>🎯</div>
                  <div className={`${styles.cubeFace} ${styles.right}`}>💎</div>
                  <div className={`${styles.cubeFace} ${styles.top}`}>🌟</div>
                  <div className={`${styles.cubeFace} ${styles.bottom}`}>🚀</div>
                </div>
              </div>
            </Grid>
          </Grid>
        </Container>
      </section>

      {/* ─── FEATURES ─── */}
      <section className={styles.features}>
        <Container maxWidth="lg">
          <Box ref={addObserveRef} className={styles.observeEl} sx={{ mb: 6, textAlign: 'center' }}>
            <span className={styles.sectionTag}>Почему мы</span>
            <Typography variant="h3" fontWeight={700} gutterBottom>Наши преимущества</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
              Современное оборудование, опытная команда и полный цикл производства — от идеи до готового изделия.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {FEATURES.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <div ref={addObserveRef} className={`${styles.observeEl} ${styles.featureCard}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className={styles.featureIcon} style={{ background: f.bg, color: f.color }}>
                    {f.icon}
                  </div>
                  <Typography variant="h6" fontWeight={600} gutterBottom>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{f.desc}</Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className={styles.howItWorks}>
        <Container maxWidth="lg">
          <Box ref={addObserveRef} className={styles.observeEl} sx={{ mb: 6 }}>
            <span className={styles.sectionTag}>Процесс</span>
            <Typography variant="h3" fontWeight={700}>Как это работает</Typography>
          </Box>

          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid item xs={12} sm={6} key={step.n}>
                <div ref={addObserveRef} className={`${styles.observeEl} ${styles.step}`} style={{ transitionDelay: `${i * 120}ms` }}>
                  <div className={styles.stepNum}>{step.n}</div>
                  <div>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{step.title}</Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{step.desc}</Typography>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* ─── MATERIALS ─── */}
      <section className={styles.materials}>
        <Container maxWidth="lg">
          <Box ref={addObserveRef} className={styles.observeEl} sx={{ mb: 6, textAlign: 'center' }}>
            <span className={styles.sectionTag}>Материалы</span>
            <Typography variant="h3" fontWeight={700}>Из чего мы печатаем</Typography>
          </Box>
          <Grid container spacing={3}>
            {MATERIALS.map((m, i) => (
              <Grid item xs={6} sm={3} key={m.name}>
                <div ref={addObserveRef} className={`${styles.observeEl} ${styles.materialCard}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{m.emoji}</div>
                  <Typography variant="h5" fontWeight={800} sx={{ color: m.color, mb: 1 }}>{m.name}</Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.82rem">{m.desc}</Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* ─── CTA ─── */}
      <section className={styles.cta}>
        <div className={styles.ctaBg} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <div ref={addObserveRef} className={`${styles.observeEl} ${styles.ctaCard}`}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Готовы начать?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}>
              Оставьте заявку прямо сейчас — менеджер свяжется с вами в течение часа
              и рассчитает стоимость вашего проекта.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <Button variant="contained" size="large" onClick={() => navigate('/order')} sx={{ px: 5, py: 1.5, fontSize: '1rem' }}>
                Оставить заявку
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/catalog')} sx={{ px: 5, py: 1.5, fontSize: '1rem', borderColor: 'rgba(255,255,255,0.15)', color: '#e8e8f0', '&:hover': { borderColor: '#00e5ff', color: '#00e5ff' } }}>
                Каталог товаров
              </Button>
            </Box>
          </div>
        </Container>
      </section>
    </div>
  );
}
