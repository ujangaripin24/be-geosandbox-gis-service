'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GeoProvinsi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GeoProvinsi.init({
    kode_provinsi: DataTypes.STRING,
    nama_provinsi: DataTypes.STRING,
    geom: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'GeoProvinsi',
  });
  return GeoProvinsi;
};