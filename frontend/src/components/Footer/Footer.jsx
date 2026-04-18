import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const SHOP_LINKS = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/order', label: 'Печать на заказ' },
];

const STUDIO_LINKS = [
  { to: '/about', label: 'О студии' },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandBlock}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoDot} />
              <span className={styles.logoWord}>форма</span>
            </Link>
            <p className={styles.tagline}>
              Студия 3D-печати. Фактура, слои, <em>ручная работа</em>.
            </p>
          </div>

          <div className={styles.col}>
            <h4>Магазин</h4>
            <ul>
              {SHOP_LINKS.map((l) => (
                <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4>Студия</h4>
            <ul>
              {STUDIO_LINKS.map((l) => (
                <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
              ))}
              <li><a href="mailto:info@forma.studio">info@forma.studio</a></li>
              <li><a href="tel:+74951234567">+7 (495) 123-45-67</a></li>
            </ul>
          </div>

        </div>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} ФОРМА / Москва, ул.&nbsp;Технологическая&nbsp;15</span>
          <span>instagram / telegram / vk</span>
        </div>
      </div>
    </footer>
  );
}
