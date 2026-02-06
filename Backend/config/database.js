const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/azan_db', {
  dialect: 'postgres',
  logging: isProduction ? false : console.log,
  dialectOptions: isProduction ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
