'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TblFolderProject extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TblFolderProject.belongsTo(models.DetailUsers, {
        foreignKey: 'uuid_user',
        targetKey: 'uuid',
        as: 'user'
      });
      TblFolderProject.hasMany(models.TblProjectGeo, {
        foreignKey: 'uuid_folder',
        sourceKey: 'uuid',
        as: 'projects'
      });
    }
  }
  TblFolderProject.init({
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uuid_user: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TblFolderProject',
    tableName: 'tbl_folder_project',
    timestamps: true
  });
  return TblFolderProject;
};