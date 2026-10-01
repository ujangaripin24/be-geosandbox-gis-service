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
    }
  }
  TblFolderProject.init({
    uuid: DataTypes.STRING,
    name: DataTypes.STRING,
    uuid_user: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TblFolderProject',
  });
  return TblFolderProject;
};