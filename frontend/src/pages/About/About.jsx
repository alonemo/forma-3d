import React, { useEffect, useRef } from 'react';
import { Container, Grid, Typography, Box, Chip } from '@mui/material';
import styles from './About.module.css';

const TEAM = [
  { emoji: '👨‍💻', name: 'Алексей Воронов', role: 'Основатель & CTO', bg: 'rgba(0,229,255,0.1)', color: '#00e5ff', desc: '10 лет в промышленном дизайне и прототипировании. Влюблён в точность.' },
  { emoji: '🎨', name: 'Мария Белова', role: 'Дизайнер & 3D-моделлер', bg: 'rgba(124,77,255,0.1)', color: '#7c4dff', desc: 'Выпускница МГХПА. Создаёт модели для печати любой сложности.' },
  { emoji: '🔧', name: 'Дмитрий Орлов', role: 'Инженер производства', bg: 'rgba(255,109,0,0.1)', color: '#ff6d00', desc: 'Настраивает оборудование и следит за качеством каждого изделия.' },
  { emoji: '📦', name: 'Ольга Никитина', role: 'Менеджер клиентов', bg: 'rgba(0,230,118,0.1)', color: '#00e676', desc: 'Координирует заказы и всегда на связи с клиентами.' },
];

const VALUES = [
  { emoji: '🎯', title: 'Точность', desc: 'Каждый заказ проходит контроль качества. Отклонение не более 0.1 мм.' },
  { emoji: '⚡', title: 'Скорость', desc: 'Стремимся выполнять заказы в кратчайшие сроки без потери качества.' },
  { emoji: '🤝', title: 'Честность', desc: 'Реалистичные сроки, прозрачное ценообразование, никаких скрытых платежей.' },
  { emoji: '🌱', title: 'Экологичность', desc: 'Используем биоразлагаемые материалы и перерабатываем производственные отходы.' },
];

const HISTORY = [
  { year: '2019', text: 'Основание компании. Первый принтер, первый заказ — органайзер для стола.' },
  { year: '2020', text: 'Запуск онлайн-каталога. Первые 100 клиентов за год.' },
  { year: '2021', text: 'Расширение парка оборудования. Добавили SLA-печать для высокоточных изделий.' },
  { year: '2022', text: 'Партнёрство с 3 промышленными предприятиями Москвы и МО.' },
  { year: '2023', text: 'Переезд в новый цех 200 м². Штат вырос до 8 человек.' },
  { year: '2024', text: 'Запуск нового сайта. Более 500 выполненных заказов.' },
];

export default function About() {
  const observeRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
      { threshold: 0.12 }
    );
    observeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const r = (el) => { if (el && !observeRefs.current.includes(el)) observeRefs.current.push(el); };

  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Chip label="О компании" size="small" sx={{ mb: 2, background: 'rgba(124,77,255,0.15)', color: '#7c4dff', fontWeight: 600 }} />
          <Typography variant="h2" fontWeight={800} sx={{ mb: 2, maxWidth: 600 }}>
            Мы делаем <span style={{ color: '#00e5ff' }}>сложное</span> — простым
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 580, lineHeight: 1.8, fontSize: '1.1rem' }}>
            Print3D — московская мастерская 3D-печати. Работаем с 2019 года.
            Выполнили более 500 заказов для частных лиц, стартапов и производственных компаний.
            Наша миссия — сделать технологии 3D-печати доступными для каждого.
          </Typography>
        </Container>
      </section>

      {/* Values */}
      <section style={{ padding: '60px 0' }}>
        <Container maxWidth="lg">
          <Box ref={r} className={styles.observeEl} sx={{ mb: 5 }}>
            <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>Ценности</Typography>
            <Typography variant="h4" fontWeight={700}>Что нас отличает</Typography>
          </Box>
          <Grid container spacing={3}>
            {VALUES.map((v, i) => (
              <Grid item xs={12} sm={6} key={v.title}>
                <div ref={r} className={`${styles.observeEl} ${styles.valueCard}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div style={{ fontSize: '2rem' }}>{v.emoji}</div>
                  <div>
                    <Typography variant="h6" fontWeight={700} gutterBottom>{v.title}</Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{v.desc}</Typography>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Team */}
      <section style={{ padding: '60px 0', background: 'rgba(255,255,255,0.01)' }}>
        <Container maxWidth="lg">
          <Box ref={r} className={styles.observeEl} sx={{ mb: 5, textAlign: 'center' }}>
            <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>Команда</Typography>
            <Typography variant="h4" fontWeight={700}>Люди за принтерами</Typography>
          </Box>
          <Grid container spacing={3}>
            {TEAM.map((m, i) => (
              <Grid item xs={12} sm={6} md={3} key={m.name}>
                <div ref={r} className={`${styles.observeEl} ${styles.teamCard}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className={styles.avatar} style={{ background: m.bg, color: m.color }}>{m.emoji}</div>
                  <Typography fontWeight={700} gutterBottom>{m.name}</Typography>
                  <Typography variant="caption" sx={{ color: m.color, fontWeight: 600 }}>{m.role}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>{m.desc}</Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* History */}
      <section style={{ padding: '80px 0' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <Box ref={r} className={styles.observeEl}>
                <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>История</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>С чего мы начинали</Typography>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Из небольшой мастерской с одним принтером выросли в профессиональное
                  производство с полным циклом — от моделирования до постобработки и доставки.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <div ref={r} className={`${styles.observeEl} ${styles.timeline}`}>
                {HISTORY.map((h, i) => (
                  <div key={h.year} className={styles.timelineItem} style={{ transitionDelay: `${i * 80}ms` }}>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>{h.year}</Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{h.text}</Typography>
                  </div>
                ))}
              </div>
            </Grid>
          </Grid>
        </Container>
      </section>

      {/* Contacts */}
      <section style={{ padding: '60px 0', background: 'rgba(255,255,255,0.01)' }}>
        <Container maxWidth="lg">
          <Box ref={r} className={styles.observeEl} sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700}>Контакты</Typography>
          </Box>
          <Grid container spacing={3} justifyContent="center" alignItems="stretch">
            {[
              { emoji: '📞', title: 'Телефон', val: '+7 (495) 123-45-67' },
              { emoji: '✉️', title: 'Email', val: 'info@print3d.ru' },
              { emoji: '📍', title: 'Адрес', val: 'Технологическая ул., 15' },
              { emoji: '⏰', title: 'Режим работы', val: 'Пн–Пт: 9:00–18:00' },
            ].map((c, i) => (
              <Grid item xs={12} sm={6} md={3} key={c.title}>
                <Box ref={r} className={`${styles.observeEl} ${styles.valueCard}`} style={{ transitionDelay: `${i * 80}ms`, flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{c.emoji}</div>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{c.title}</Typography>
                  <Typography fontWeight={600} sx={{ mt: 0.5 }}>{c.val}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>
    </div>
  );
}
