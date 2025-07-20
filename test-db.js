// test-db.js
try {
  const { Client } = require('pg');
  console.log('✅ Пакет "pg" успешно найден и импортирован!');

  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/lot_db'
  });
  console.log('🏁 Попытка подключиться к базе данных...');
  
  client.connect(err => {
    if (err) {
      console.error('❌ Ошибка подключения:', err.stack);
    } else {
      console.log('✅ Успешно подключено к PostgreSQL!');
    }
    client.end();
  });

} catch (e) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Не удалось даже импортировать пакет "pg".');
  console.error(e);
}
