const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prayer = require('./Prayer')(sequelize, DataTypes);
const Voice = require('./Voice')(sequelize, DataTypes);
const Event = require('./Event')(sequelize, DataTypes);
const EventSchedule = require('./EventSchedule')(sequelize, DataTypes);
const Admin = require('./Admin')(sequelize, DataTypes);

// Associations
Voice.hasMany(Event, { foreignKey: 'voice_id', as: 'events' });
Event.belongsTo(Voice, { foreignKey: 'voice_id', as: 'voice' });
Event.hasMany(EventSchedule, { foreignKey: 'event_id', as: 'schedules', onDelete: 'CASCADE' });
EventSchedule.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

module.exports = {
  sequelize,
  Prayer,
  Voice,
  Event,
  EventSchedule,
  Admin
};
