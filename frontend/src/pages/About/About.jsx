import React, { useEffect, useRef } from 'react';
import styles from './About.module.css';

const TEAM = [
  { name: 'Алексей Воронов',  role: 'Основатель · CTO',         since: '2019', desc: 'Десять лет в промышленном дизайне и прототипировании. Следит за точностью и качеством.' },
  { name: 'Мария Белова',     role: 'Дизайнер · 3D-моделлер',   since: '2020', desc: 'Выпускница МГХПА. Моделирует под печать любой сложности, от декора до функциональных изделий.' },
  { name: 'Дмитрий Орлов',    role: 'Инженер производства',     since: '2021', desc: 'Настраивает оборудование, обслуживает парк принтеров и проводит контроль каждого заказа.' },
  { name: 'Ольга Никитина',   role: 'Менеджер клиентов',        since: '2022', desc: 'Координирует заказы и консультирует по выбору материалов. Всегда на связи.' },
];

const VALUES = [
  { title: 'Точность',     desc: 'Каждый заказ проходит контроль качества. Отклонение — не более 0.1 мм по контрольным размерам.' },
  { title: 'Скорость',     desc: 'Работаем в короткие сроки без потери качества. Статус заказа доступен в личном кабинете.' },
  { title: 'Честность',    desc: 'Реальные сроки, прозрачное ценообразование, никаких скрытых платежей и сюрпризов в счёте.' },
  { title: 'Экологичность',desc: 'Биоразлагаемые материалы как основа, переработка производственных отходов.' },
];

const HISTORY = [
  ['2019', 'Основание студии. Один принтер, один заказ — органайзер для рабочего стола.'],
  ['2020', 'Запуск онлайн-каталога. Первые сто клиентов. Добавлен материал PETG.'],
  ['2021', 'Расширение парка. SLA-печать для высокоточных изделий и ювелирных мастер-моделей.'],
  ['2022', 'Партнёрство с тремя промышленными предприятиями Москвы и Московской области.'],
  ['2023', 'Переезд в цех 200 м². Штат вырос до восьми человек. Ночные смены для крупных заказов.'],
  ['2024', 'Запуск нового сайта. Пятисотый заказ отгружен в августе.'],
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
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>О студии · Print3D · Москва</div>
          <h1 className={styles.heroTitle}>
            Мы делаем<br />
            <span className={styles.heroTitleItalic}>сложное</span> простым.
          </h1>
        </div>

        <div className={styles.heroLede}>
          Print3D — московская студия 3D-печати. Работаем с&nbsp;2019 года,
          выполнили более пятисот заказов для частных лиц, стартапов и&nbsp;производственных компаний.
          <div className="muted">
            Наша цель — сделать технологию 3D-печати доступной для каждого, у&nbsp;кого есть
            идея и&nbsp;желание воплотить её в&nbsp;материи.
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={styles.section}>
        <div ref={r} className={`${styles.sectionHead} ${styles.observeEl}`}>
          <div className={styles.sectionNum}>01 / Ценности</div>
          <div>
            <h2 className={styles.sectionTitle}>Что нас отличает</h2>
            <p className={styles.sectionLead}>
              Четыре принципа, которые мы держим в&nbsp;голове при каждом заказе —
              от&nbsp;первого письма до&nbsp;отправки курьеру.
            </p>
          </div>
        </div>

        <div className={styles.valuesList}>
          {VALUES.map((v, i) => (
            <div key={v.title} ref={r} className={`${styles.valueItem} ${styles.observeEl}`}
              style={{ transitionDelay: `${i * 60}ms` }}>
              <div className={styles.valueNum}>
                {String(i + 1).padStart(2, '0')} / 04
              </div>
              <div className={styles.valueTitle}>{v.title}</div>
              <div className={styles.valueDesc}>{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <div className={styles.sectionAltWrap}>
        <section className={styles.section}>
          <div ref={r} className={`${styles.sectionHead} ${styles.observeEl}`}>
            <div className={styles.sectionNum}>02 / Команда</div>
            <div>
              <h2 className={styles.sectionTitle}>Люди за принтерами</h2>
              <p className={styles.sectionLead}>
                Маленькая студия — четыре человека, каждый отвечает за&nbsp;свой участок
                производственной цепочки.
              </p>
            </div>
          </div>

          <div className={styles.teamList}>
            {TEAM.map((m, i) => (
              <div key={m.name} ref={r} className={`${styles.teamRow} ${styles.observeEl}`}
                style={{ transitionDelay: `${i * 60}ms` }}>
                <div className={styles.teamNum}>
                  {String(i + 1).padStart(2, '0')} / 04
                </div>
                <div>
                  <div className={styles.teamName}>{m.name}</div>
                  <div className={styles.teamRole}>{m.role}</div>
                </div>
                <div className={styles.teamDesc}>{m.desc}</div>
                <div className={styles.teamSince}>с {m.since}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* History */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionNum}>03 / История</div>
          <div>
            <h2 className={styles.sectionTitle}>С чего мы начинали</h2>
          </div>
        </div>

        <div className={styles.timelineGrid}>
          <div className={styles.timelineIntro}>
            <p className={styles.timelineIntroText}>
              Из небольшой мастерской с&nbsp;одним принтером — в&nbsp;профессиональное
              производство с&nbsp;полным циклом: моделирование, печать, постобработка, доставка.
            </p>
          </div>

          <div className={styles.timeline}>
            {HISTORY.map(([year, text], i) => (
              <div key={year} ref={r} className={`${styles.timelineItem} ${styles.observeEl}`}
                style={{ transitionDelay: `${i * 60}ms` }}>
                <div className={styles.timelineYear}>{year}</div>
                <div className={styles.timelineText}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacts */}
      <div className={styles.sectionAltWrap}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionNum}>04 / Контакты</div>
            <div>
              <h2 className={styles.sectionTitle}>Связаться со студией</h2>
              <p className={styles.sectionLead}>
                Пишите, звоните или заходите — будем рады обсудить ваш проект.
              </p>
            </div>
          </div>

          <div className={styles.contacts}>
            <div className={styles.contactItem}>
              <div className={styles.contactKey}>Телефон</div>
              <a href="tel:+74951234567" className={styles.contactValueSmall}>
                +7 (495) 123-45-67
              </a>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactKey}>Email</div>
              <a href="mailto:info@print3d.ru" className={styles.contactValueSmall}>
                info@print3d.ru
              </a>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactKey}>Адрес</div>
              <div className={styles.contactValueSmall}>
                Москва, ул. Технологическая, 15
              </div>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactKey}>Часы работы</div>
              <div className={styles.contactValueSmall}>
                ПН–ПТ · 9:00–18:00
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
