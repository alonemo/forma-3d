import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Typography, Box, TextField, Button,
  MenuItem, Alert, Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import useOrderStore from '../../store/orderStore';
import useAuthStore from '../../store/authStore';
import styles from './Order.module.css';

const MATERIALS = ['PLA', 'PETG', 'ABS', 'Nylon', 'TPU', 'Resin', 'Не знаю / посоветуйте'];

const INFO_ITEMS = [
  { icon: '⏱️', title: 'Сроки изготовления', lines: ['Простые изделия: 1–3 дня', 'Средняя сложность: 3–7 дней', 'Сложные модели: 7–14 дней', 'После согласования и предоплаты'] },
  { icon: '💰', title: 'Ценообразование', lines: ['Зависит от объёма, материала и сложности', 'Мы пришлём расчёт после заявки', 'Минимальный заказ: 300 ₽', 'Скидки от 5 штук'] },
  { icon: '📏', title: 'Ограничения', lines: ['Макс. размер FDM: 300×300×400 мм', 'Макс. размер SLA: 190×120×250 мм', 'Для больших изделий — сборка из частей'] },
  { icon: '🚚', title: 'Доставка', lines: ['СДЭК, Почта России', 'Курьер по Москве (от 500 ₽)', 'Самовывоз бесплатно', 'Упаковка включена в стоимость'] },
];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setError('');
    const result = await submitCustomOrder(form);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ pt: 20, pb: 10 }}>
        <div className={styles.successBox}>
          <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>Заявка отправлена!</Typography>
          <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            Мы получили вашу заявку и свяжемся с вами в течение 1 часа по указанному номеру телефона.
            Вы также можете отслеживать статус в{' '}
            <span style={{ color: '#00e5ff', cursor: 'pointer' }} onClick={() => navigate('/profile')}>личном кабинете</span>.
          </Typography>
          <Button variant="contained" onClick={() => { setSuccess(false); setForm({ description:'',dimensions:'',material:'',contact_phone:'',desired_deadline:'' }); }}>
            Отправить ещё одну заявку
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div>
      <section className={styles.hero}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="secondary.main" fontWeight={700} letterSpacing={2}>Индивидуальный заказ</Typography>
          <Typography variant="h3" fontWeight={800} gutterBottom>Заказать изделие</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
            Опишите, что вам нужно — мы рассчитаем стоимость и свяжемся с вами. Бесплатная консультация.
          </Typography>
        </Container>
      </section>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Grid container spacing={4}>
          {/* Form */}
          <Grid item xs={12} md={7}>
            <div className={styles.formCard}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Форма заявки</Typography>

              {!user && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Для отправки заявки необходимо <span style={{ color: '#00e5ff', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>войти в аккаунт</span>
                </Alert>
              )}

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Step 1 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <span className={styles.stepChip}>1</span>
                    <Typography fontWeight={600}>Описание изделия *</Typography>
                  </Box>
                  <TextField
                    fullWidth multiline rows={4}
                    placeholder="Опишите, что нужно изготовить. Назначение, особенности, требования к прочности, внешнему виду..."
                    value={form.description}
                    onChange={set('description')}
                    required
                  />
                </Box>

                {/* Step 2 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <span className={styles.stepChip}>2</span>
                    <Typography fontWeight={600}>Размеры</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    placeholder="Например: 100×50×30 мм или примерный размер"
                    value={form.dimensions}
                    onChange={set('dimensions')}
                    helperText="Укажите габариты, если знаете. Мы уточним при необходимости."
                  />
                </Box>

                {/* Step 3 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <span className={styles.stepChip}>3</span>
                    <Typography fontWeight={600}>Материал</Typography>
                  </Box>
                  <TextField
                    fullWidth select
                    value={form.material}
                    onChange={set('material')}
                    label="Выберите материал"
                  >
                    <MenuItem value="">— Не выбрано —</MenuItem>
                    {MATERIALS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                  </TextField>
                </Box>

                {/* Step 4 */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <span className={styles.stepChip}>4</span>
                      <Typography fontWeight={600}>Телефон</Typography>
                    </Box>
                    <TextField
                      fullWidth
                      placeholder="+7 (___) ___-__-__"
                      value={form.contact_phone}
                      onChange={set('contact_phone')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <span className={styles.stepChip}>5</span>
                      <Typography fontWeight={600}>Желаемый срок</Typography>
                    </Box>
                    <TextField
                      fullWidth type="date"
                      value={form.desired_deadline}
                      onChange={set('desired_deadline')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !form.description}
                  endIcon={<SendIcon />}
                  sx={{ mt: 1, py: 1.5 }}
                >
                  {loading ? 'Отправка...' : 'Отправить заявку'}
                </Button>
              </Box>
            </div>
          </Grid>

          {/* Info */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {INFO_ITEMS.map((info) => (
                <div key={info.title} className={styles.infoCard}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                    <Typography fontWeight={700}>{info.title}</Typography>
                  </Box>
                  {info.lines.map((line) => (
                    <Typography key={line} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                      <span style={{ color: '#00e5ff', flexShrink: 0 }}>—</span>
                      {line}
                    </Typography>
                  ))}
                </div>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
