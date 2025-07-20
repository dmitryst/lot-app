import { Sequelize } from 'sequelize';
import pg from 'pg';

export const sequelize = new Sequelize('lot_db', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
});
