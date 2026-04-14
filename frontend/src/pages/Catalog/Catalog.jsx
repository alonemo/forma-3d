import React, { useEffect, useRef, useState } from 'react';
import {
  Container, Grid, Typography, Box, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Skeleton, Button, Drawer, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import ProductCard from '../../components/ProductCard/ProductCard';
import { getProductsApi, getCategoriesApi, getMaterialsApi } from '../../api/products';
import styles from './Catalog.module.css';

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Сначала новые' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
  { value: 'name-asc', label: 'По названию' },
];

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [material, setMaterial] = useState('');
  const [sort, setSort] = useState('created_at-desc');

  const fetchProducts = async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setFetching(true);
    try {
      const [sortField, sortOrder] = sort.split('-');
      const { data } = await getProductsApi({ search: search || undefined, category: category || undefined, material: material || undefined, sort: sortField, order: sortOrder });
      setProducts(data);
    } catch { /* ignore */ }
    finally { setInitialLoading(false); setFetching(false); }
  };

  useEffect(() => {
    Promise.all([getCategoriesApi(), getMaterialsApi()]).then(([c, m]) => {
      setCategories(c.data);
      setMaterials(m.data);
    });
  }, []);

  const isFirstFetch = useRef(true);
  useEffect(() => {
    const initial = isFirstFetch.current;
    if (initial) isFirstFetch.current = false;
    const t = setTimeout(() => fetchProducts(initial), initial ? 0 : 300);
    return () => clearTimeout(t);
  }, [search, category, material, sort]);

  const clearFilters = () => { setSearch(''); setCategory(''); setMaterial(''); setSort('created_at-desc'); };
  const hasFilters = search || category || material || sort !== 'created_at-desc';
  const activeFilterCount = [search, category, material, sort !== 'created_at-desc'].filter(Boolean).length;

  const filterContent = (
    <>
      <TextField
        fullWidth
        size="small"
        placeholder="Поиск..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#9090a8' }} /></InputAdornment> }}
        sx={{ mb: 3 }}
      />

      <Typography className={styles.filterTitle}>Категория</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mb: 3 }}>
        {['Все', ...categories].map((c) => {
          const val = c === 'Все' ? '' : c;
          const active = category === val;
          return (
            <button
              key={c}
              onClick={() => setCategory(active && c !== 'Все' ? '' : val)}
              className={`${styles.categoryItem} ${active ? styles.categoryActive : ''}`}
            >
              {c}
            </button>
          );
        })}
      </Box>

      <Typography className={styles.filterTitle}>Материал</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
        {materials.map((m) => (
          <button
            key={m}
            onClick={() => setMaterial(material === m ? '' : m)}
            className={`${styles.materialChip} ${material === m ? styles.materialActive : ''}`}
          >
            {m}
          </button>
        ))}
      </Box>

      {hasFilters && (
        <button className={styles.resetBtn} onClick={clearFilters}>
          <CloseIcon sx={{ fontSize: 14 }} />
          Сбросить фильтры
        </button>
      )}
    </>
  );

  return (
    <div>
      <section className={styles.hero}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>Каталог</Typography>
          <Typography variant="h3" fontWeight={800} gutterBottom>Готовые изделия</Typography>
          <Typography color="text.secondary">Выберите из наших готовых моделей или закажите уникальное изделие</Typography>
        </Container>
      </section>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Grid container spacing={3}>
          {/* Desktop sidebar */}
          <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <div className={styles.filters}>
              {filterContent}
            </div>
          </Grid>

          {/* Products */}
          <Grid item xs={12} md={9}>
            {/* Top bar: count + sort + mobile filters button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Mobile filter button */}
                <Button
                  startIcon={<TuneIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => setMobileFiltersOpen(true)}
                  sx={{
                    display: { xs: 'inline-flex', md: 'none' },
                    borderColor: hasFilters ? 'primary.main' : 'rgba(255,255,255,0.15)',
                    color: hasFilters ? 'primary.main' : '#9090a8',
                  }}
                >
                  Фильтры
                  {activeFilterCount > 0 && (
                    <Chip label={activeFilterCount} size="small" color="primary"
                      sx={{ ml: 0.75, height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }} />
                  )}
                </Button>

                <Typography color="text.secondary" variant="body2">
                  {initialLoading ? 'Загрузка...' : `Найдено: ${products.length} товаров`}
                </Typography>
              </Box>

              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>Сортировка</InputLabel>
                <Select value={sort} onChange={(e) => setSort(e.target.value)} label="Сортировка">
                  {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {initialLoading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid item xs={12} sm={6} lg={4} key={i}>
                    <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            ) : products.length === 0 ? (
              <div className={styles.empty}>
                <Typography variant="h2" sx={{ mb: 1 }}>🔍</Typography>
                <Typography variant="h6" gutterBottom>Ничего не найдено</Typography>
                <Typography variant="body2">Попробуйте изменить фильтры или поисковый запрос</Typography>
              </div>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                {products.map((p) => (
                  <Grid item xs={12} sm={6} lg={4} key={p.id}>
                    <ProductCard product={p} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile filters drawer */}
      <Drawer
        anchor="left"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        PaperProps={{ sx: { width: 290, background: '#0d0d16', p: 3, borderRight: '1px solid rgba(255,255,255,0.07)' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography fontWeight={700}>Фильтры</Typography>
          <Button size="small" onClick={() => setMobileFiltersOpen(false)} sx={{ color: '#9090a8', minWidth: 0, p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
        {filterContent}
        <Box sx={{ mt: 2 }}>
          <Button fullWidth variant="contained" onClick={() => setMobileFiltersOpen(false)}>
            Показать товары
          </Button>
        </Box>
      </Drawer>
    </div>
  );
}
