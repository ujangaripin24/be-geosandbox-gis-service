"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GeoWilayah extends Model {
    static associate() {}
  }

  GeoWilayah.init(
    {
      object_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      kode_provinsi: DataTypes.STRING(10),
      kode_kabupaten: DataTypes.STRING(20),
      kode_kecamatan: DataTypes.STRING(20),
      kode_desa: DataTypes.STRING(30),
      nama_desa: DataTypes.STRING(100),
      nama_kecamatan: DataTypes.STRING(100),
      nama_kabupaten: DataTypes.STRING(100),
      nama_provinsi: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      kode_bps_provinsi: DataTypes.STRING(10),
      kode_bps_kabupaten: DataTypes.STRING(10),
      kode_bps_kecamatan: DataTypes.STRING(15),
      kode_bps_desa: DataTypes.STRING(20),
      fcode: DataTypes.STRING(20),
      metadata: DataTypes.STRING(100),
      remark: DataTypes.STRING(150),
      srs_id: DataTypes.STRING(20),
      luas: DataTypes.DOUBLE,
      luas_wilayah: DataTypes.DOUBLE,
      tipe_administrasi: DataTypes.INTEGER,
      sumber_data: DataTypes.STRING(200),
      geom: {
        type: DataTypes.GEOMETRY("MULTIPOLYGON", 4326),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TblGeoWilayah",
      tableName: "tbl_geo_wilayah",
      timestamps: true,
    },
  );

  return GeoWilayah;
};