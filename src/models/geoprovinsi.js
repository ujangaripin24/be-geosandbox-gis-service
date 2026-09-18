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
  GeoProvinsi.init(
    {
      kode_provinsi: {
        type: DataTypes.STRING(2),
        primaryKey: true,
        allowNull: false,
      },
      nama_provinsi: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      geom: {
        type: DataTypes.GEOMETRY("MULTIPOLYGON", 4326),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "TblGeoProvinsi",
      tableName: "tbl_geo_provinsi",
      timestamps: true,
    },
  );
  return GeoProvinsi;
};