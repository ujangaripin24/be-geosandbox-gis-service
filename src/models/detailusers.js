'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DetailUsers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DetailUsers.hasMany(models.TblFolderProject, {
        foreignKey: 'uuid_user',
        sourceKey: 'uuid',
        as: 'folders'
      });
    }
  }
  DetailUsers.init({
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    role: {
      type: DataTypes.ENUM("SUPERADMIN", "ADMIN", "USER", "GUEST"),
      defaultValue: "GUEST",
      allowNull: false,
    },
    uuid_company: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    event_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'DetailUsers',
    tableName: 'tbl_users',
    timestamps: true
  });
  return DetailUsers;
};