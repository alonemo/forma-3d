import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton, Drawer, Button, Menu, MenuItem } from '@mui/material';
import ProductCard from '../../components/ProductCard/ProductCard';
import { pickProductColor, PRODUCT_PALETTE } from '../../components/ProductForm/ProductForm';
import { getProductsApi, getCategoriesApi, getMaterialsApi } from '../../api/products';
import { noun } from '../../utils/format';
import styles from './Catalog.module.css';

const MATERIAL_DESC = {
  'PLA':          'Биопластик из кукурузы',
  'PETG':         'Прочный, пищевой',
  'Смола':        'Высокая детализация',
  'PLA + дерево': 'Древесная фактура',
};

const COLOR_SWATCHES = [
  PRODUCT_PALETTE[0], // terracotta
  PRODUCT_PALETTE[1], // ochre
  PRODUCT_PALETTE[4], // charcoal / ink
  PRODUCT_PALETTE[3], // sand
  PRODUCT_PALETTE[2], // olive
  PRODUCT_PALETTE[5], // forest
];

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Сначала новые' },
  { value: 'price-asc',       label: 'Сначала дешевле' },
  { value: 'price-desc',      label: 'Сначала дороже' },
  { value: 'name-asc',        label: 'По алфавиту' },
];

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('created_at-desc');
  const [sortAnchor, setSortAnchor] = useState(null);

  // Load categories and materials once
  useEffect(() => {
    Promise.all([getCategoriesApi(), getMaterialsApi()])
      .then(([c, m]) => {
        setCategories(c.data);
        setMaterialsList(m.data);
      })
      .catch(() => {});
  }, []);

  // Apply material URL param once on mount (e.g. /catalog?material=PLA)
  useEffect(() => {
    const m = searchParams.get('material');
    if (m) setMaterials([m]);
    const c = searchParams.get('category');
    if (c) setCategory(c);
  }, []); // eslint-disable-line

  // Fetch products with server-side search + sort; filter rest client-side
  const fetchProducts = async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setFetching(true);
    try {
      const [sortField, sortOrder] = sort.split('-');
      const { data } = await getProductsApi({
        search: search || undefined,
        sort: sortField, order: sortOrder,
      });
      setProducts(data);
    } catch { /* ignore */ }
    finally { setInitialLoading(false); setFetching(false); }
  };

  const isFirstFetch = useRef(true);
  useEffect(() => {
    const initial = isFirstFetch.current;
    if (initial) isFirstFetch.current = false;
    const t = setTimeout(() => fetchProducts(initial), initial ? 0 : 250);
    return () => clearTimeout(t);
  }, [search, sort]);

  const toggleMaterial = (m) =>
    setMaterials((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const toggleColor = (hex) => {
    const key = hex.toLowerCase();
    setColors((prev) =>
      prev.map((c) => c.toLowerCase()).includes(key)
        ? prev.filter((c) => c.toLowerCase() !== key)
        : [...prev, hex]
    );
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setMaterials([]); setColors([]);
    setPriceMin(''); setPriceMax(''); setSort('created_at-desc');
  };

  const hasFilters =
    search || category || materials.length > 0 || colors.length > 0 || priceMin || priceMax || sort !== 'created_at-desc';

  // Client-side filtering of server results
  const filtered = useMemo(() => {
    let list = products;
    if (category) list = list.filter((p) => p.category === category);
    if (materials.length) list = list.filter((p) => materials.includes(p.material));
    if (colors.length) {
      const wanted = new Set(colors.map((c) => c.toLowerCase()));
      list = list.filter((p) => {
        const own = Array.isArray(p.colors) && p.colors.length > 0
          ? p.colors.map((c) => c.toLowerCase())
          : [pickProductColor(p).toLowerCase()];
        return own.some((c) => wanted.has(c));
      });
    }
    const pmin = parseInt(priceMin, 10);
    const pmax = parseInt(priceMax, 10);
    if (!isNaN(pmin)) list = list.filter((p) => parseFloat(p.price) >= pmin);
    if (!isNaN(pmax)) list = list.filter((p) => parseFloat(p.price) <= pmax);
    return list;
  }, [products, category, materials, colors, priceMin, priceMax]);

  const catCount = (name) =>
    name === '' ? products.length : products.filter((p) => p.category === name).length;

  const matCount = (name) => products.filter((p) => p.material === name).length;

  const openProduct = (p) => navigate(`/catalog/${p.id}`);

  const FiltersBlock = (
    <>
      <div className={styles.filterSearch}>
        <input
          className={styles.searchInput}
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>Категория</div>
        <div className={styles.list}>
          {['', ...categories].map((c) => {
            const label = c === '' ? 'Всё' : c;
            const active = category === c;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setCategory(c)}
                className={`${styles.catRow} ${active ? styles.catRowActive : ''}`}
              >
                <span>{label}</span>
                <span className={styles.rowCount}>{catCount(c)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>Материал</div>
        <div className={styles.list}>
          {materialsList.map((m) => {
            const active = materials.includes(m);
            const desc = MATERIAL_DESC[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMaterial(m)}
                className={`${styles.matRow} ${active ? styles.matRowActive : ''}`}
              >
                <span className={styles.matName}>
                  {m}
                  {desc && <em className={styles.matDesc}> — {desc}</em>}
                </span>
                <span className={styles.rowCount}>{matCount(m)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>Цвет</div>
        <div className={styles.swatches}>
          {COLOR_SWATCHES.map((hex) => {
            const active = colors.map((c) => c.toLowerCase()).includes(hex.toLowerCase());
            return (
              <button
                key={hex}
                type="button"
                aria-label={`Цвет ${hex}`}
                aria-pressed={active}
                onClick={() => toggleColor(hex)}
                className={`${styles.swatch} ${active ? styles.swatchActive : ''}`}
                style={{ background: hex }}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>Цена, ₽</div>
        <div className={styles.priceRow}>
          <input
            className={styles.priceInput}
            placeholder="от"
            inputMode="numeric"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ''))}
          />
          <input
            className={styles.priceInput}
            placeholder="до"
            inputMode="numeric"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>

      {hasFilters && (
        <button type="button" className={styles.clearFilters} onClick={clearFilters}>
          × Сбросить фильтры
        </button>
      )}
    </>
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHead}>
          <h1>Каталог<br /><em>работ.</em></h1>
          <div className={styles.pageHeadSub}>
            <p>
              Выбирайте из готового ассортимента — или закажите индивидуальное
              изделие на&nbsp;странице «Заказать». Все изделия печатаются
              под&nbsp;ваш&nbsp;заказ.
            </p>
            <div className={styles.pageHeadMeta}>
              Обновлено сегодня
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.filters}>
            {FiltersBlock}
          </aside>

          <div className={styles.resultColumn}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <Button
                  className={styles.mobileFiltersBtn}
                  variant="outlined"
                  size="small"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  Фильтры
                </Button>
                <span className={styles.count}>
                  {initialLoading
                    ? 'ЗАГРУЗКА…'
                    : `НАЙДЕНО: ${filtered.length} ${noun(filtered.length, ['ИЗДЕЛИЕ', 'ИЗДЕЛИЯ', 'ИЗДЕЛИЙ'])}`}
                </span>
              </div>

              <div className={styles.sortWrap}>
                <button
                  type="button"
                  className={styles.sortTrigger}
                  onClick={(e) => setSortAnchor(e.currentTarget)}
                  aria-haspopup="true"
                >
                  <span className={styles.sortKey}>Сорт:</span>
                  <span className={styles.sortValue}>
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  </span>
                  <span className={styles.sortCaret} aria-hidden>↓</span>
                </button>
                <Menu
                  anchorEl={sortAnchor}
                  open={Boolean(sortAnchor)}
                  onClose={() => setSortAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ paper: { className: styles.sortMenuPaper } }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <MenuItem
                      key={o.value}
                      selected={o.value === sort}
                      onClick={() => { setSort(o.value); setSortAnchor(null); }}
                      className={styles.sortMenuItem}
                    >
                      {o.label}
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            </div>

            {initialLoading ? (
              <div className={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={420} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <h3>Ничего не найдено.</h3>
                <p>Попробуйте сбросить фильтры или поменять поисковый запрос.</p>
                {hasFilters && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearFilters}
                    sx={{ mt: 2.5 }}
                  >
                    Сбросить всё
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={styles.grid}
                style={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.15s' }}
              >
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={openProduct} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        anchor="left"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        PaperProps={{ sx: { width: 300, p: 3, background: 'var(--paper)' } }}
      >
        <div className={styles.mobileFiltersStack}>
          {FiltersBlock}
          <Button variant="contained" onClick={() => setMobileFiltersOpen(false)}>
            Показать товары
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
