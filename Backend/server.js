const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize } = require('./models');
const startAzanScheduler = require('./cron/azanScheduler');

const isProduction = process.env.NODE_ENV === 'production';

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Make io accessible to controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Test database connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

// Sync database (creates tables if they don't exist)
sequelize.sync({ alter: !isProduction })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database sync error:', err));

// Start cron job with Socket.IO instance
startAzanScheduler(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

