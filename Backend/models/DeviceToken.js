module.exports = (sequelize, DataTypes) => {
  const DeviceToken = sequelize.define('DeviceToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    platform: {
      type: DataTypes.ENUM('ios', 'android'),
      allowNull: false,
      defaultValue: 'android'
    }
  }, {
    tableName: 'device_tokens',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return DeviceToken;
};
