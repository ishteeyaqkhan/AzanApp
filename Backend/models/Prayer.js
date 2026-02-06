module.exports = (sequelize, DataTypes) => {
  const Prayer = sequelize.define('Prayer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.ENUM('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'),
      allowNull: false
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false
    },
    soundFile: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'sound_file'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'prayers',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Prayer;
};
