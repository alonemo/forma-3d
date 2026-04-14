-- Создание базы данных (выполни отдельно если нужно)
-- CREATE DATABASE print3d;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  material VARCHAR(100),
  image_url VARCHAR(500),
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('catalog','custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'created' CHECK (status IN ('created','in_progress','ready')),
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_orders (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  dimensions VARCHAR(255),
  material VARCHAR(100),
  contact_phone VARCHAR(50),
  desired_deadline DATE
);

-- Seed: Администратор (пароль: admin123)
INSERT INTO users (name, email, password_hash, role)
VALUES ('Администратор', 'admin@print3d.ru', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh0S', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed: Товары
INSERT INTO products (name, description, price, category, material, image_url, stock) VALUES
('Органайзер для стола', 'Компактный настольный органайзер с отсеками для канцелярии, телефона и кабелей. Идеально подходит для рабочего места.', 850.00, 'Органайзеры', 'PLA', null, 25),
('Подставка для ноутбука', 'Эргономичная подставка с регулируемым углом наклона. Улучшает вентиляцию и снижает нагрузку на шею.', 1200.00, 'Подставки', 'PETG', null, 15),
('Кашпо для растений', 'Декоративное кашпо в скандинавском стиле с поддоном. Доступно в нескольких размерах.', 650.00, 'Декор', 'PLA', null, 30),
('Крепление для телефона в авто', 'Универсальное крепление на дефлектор воздуховода. Подходит для телефонов до 6.7 дюймов.', 450.00, 'Автотовары', 'ABS', null, 40),
('Шестерёнка декоративная', 'Декоративный элемент в стиле стимпанк. Отлично подходит для интерьера или театрального реквизита.', 350.00, 'Декор', 'PLA', null, 50),
('Подставка для книг', 'Стильная подставка-держатель для книг и планшетов с нескользящим основанием.', 780.00, 'Подставки', 'PETG', null, 20),
('Брелок с логотипом', 'Персонализированный брелок. Изготавливается по вашему эскизу или логотипу.', 280.00, 'Аксессуары', 'PLA', null, 60),
('Корпус для Arduino', 'Защитный корпус для платы Arduino Uno с отверстиями для разъёмов и вентиляцией.', 550.00, 'Электроника', 'ABS', null, 18),
('Настенный крючок', 'Минималистичный настенный крючок для одежды и аксессуаров. Монтаж без сверления.', 320.00, 'Органайзеры', 'PLA', null, 45),
('Фигурка дракона', 'Детализированная фигурка дракона в фэнтезийном стиле. Высота 15 см.', 1500.00, 'Фигурки', 'Resin', null, 10),
('Геометрический светильник', 'Абажур с геометрическим узором. Создаёт необычные световые узоры на стенах.', 2200.00, 'Декор', 'PLA', null, 8),
('Подставка под хот-дог / кегли', 'Набор из 10 подставок для детской вечеринки или мероприятий. Яркие цвета.', 400.00, 'Аксессуары', 'PLA', null, 35)
ON CONFLICT DO NOTHING;
