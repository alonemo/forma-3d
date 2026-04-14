const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PASSWORDS = ['', 'postgres', 'admin', '12345', '123456', 'password', 'root', '1234'];

async function tryConnect(password) {
  const client = new Client({
    host: 'localhost', port: 5432,
    user: 'postgres', password,
    database: 'postgres',
    connectionTimeoutMillis: 3000,
  });
  try {
    await client.connect();
    return client;
  } catch {
    return null;
  }
}

async function main() {
  let client = null;
  let foundPassword = null;

  for (const pwd of PASSWORDS) {
    process.stdout.write(`Пробую пароль: "${pwd}"... `);
    client = await tryConnect(pwd);
    if (client) {
      foundPassword = pwd;
      console.log('✓ подключился!');
      break;
    }
    console.log('✗');
  }

  if (!client) {
    console.error('\n❌ Не удалось подключиться. Запусти: node scripts/create-db.js <пароль>');
    process.exit(1);
  }

  try {
    // Создаём БД если не существует
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname='print3d'");
    if (exists.rows.length === 0) {
      await client.query('CREATE DATABASE print3d');
      console.log('✓ База данных print3d создана');
    } else {
      console.log('ℹ База данных print3d уже существует');
    }
    await client.end();

    // Подключаемся к print3d и выполняем схему
    const dbClient = new Client({
      host: 'localhost', port: 5432,
      user: 'postgres', password: foundPassword,
      database: 'print3d',
    });
    await dbClient.connect();

    const sql = fs.readFileSync(path.join(__dirname, '../src/db/init.sql'), 'utf8');
    // Выполняем каждый statement отдельно
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      try {
        await dbClient.query(stmt);
      } catch (e) {
        if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
          console.warn(`  Предупреждение: ${e.message.slice(0, 80)}`);
        }
      }
    }

    console.log('✓ Схема и seed-данные применены');
    await dbClient.end();

    // Пишем .env с найденным паролем
    const envContent = `PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=print3d
DB_USER=postgres
DB_PASSWORD=${foundPassword}
JWT_SECRET=print3d_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
`;
    fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
    console.log(`✓ .env записан (пароль: "${foundPassword}")`);
    console.log('\n✅ Готово! Запускай: npm run dev');
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

main();
