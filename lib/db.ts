import { Sequelize } from 'sequelize';
import pg from 'pg';

// Получаем переменные из окружения или используем значения по умолчанию
const dbName = process.env.POSTGRES_DB || 'lot_db';
const dbUser = process.env.POSTGRES_USER || 'postgres';
const dbPassword = process.env.POSTGRES_PASSWORD || 'postgres';
const dbHost = process.env.POSTGRES_HOST || 'localhost';

// Проверяем, что все необходимые переменные окружения заданы в production
if (process.env.NODE_ENV === 'production' && (!process.env.POSTGRES_DB || !process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD || !process.env.POSTGRES_HOST)) {
  throw new Error('DATABASE_ERROR: Not all required environment variables are set for database connection in production.');
}

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
});
