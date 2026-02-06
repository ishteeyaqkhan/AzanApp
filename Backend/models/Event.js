module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    voiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'voice_id',
      references: {
        model: 'voices',
        key: 'id'
      }
    },
    scheduleMode: {
      type: DataTypes.ENUM('daily', 'date_range'),
      allowNull: false,
      defaultValue: 'daily',
      field: 'schedule_mode'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    },
    timeMode: {
      type: DataTypes.ENUM('fixed', 'custom'),
      allowNull: false,
      defaultValue: 'fixed',
      field: 'time_mode'
    },
    fixedTime: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'fixed_time'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'events',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Event;
};
