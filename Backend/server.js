const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { sequelize } = require('./models');
const startAzanScheduler = require('./cron/azanScheduler');

const isProduction = process.env.NODE_ENV === 'production';

// Test database connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

// Sync database (creates tables if they don't exist)
sequelize.sync({ alter: !isProduction })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database sync error:', err));

// Start cron job
startAzanScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
