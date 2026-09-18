"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS postgis;",
    );

    await queryInterface.createTable("tbl_geo_wilayah", {
      object_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      kode_provinsi: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      kode_kabupaten: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      kode_kecamatan: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      kode_desa: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      nama_desa: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      nama_kecamatan: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      nama_kabupaten: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      nama_provinsi: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kode_bps_provinsi: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      kode_bps_kabupaten: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      kode_bps_kecamatan: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      kode_bps_desa: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      fcode: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      remark: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      srs_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      luas: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      luas_wilayah: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      tipe_administrasi: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sumber_data: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      geom: {
        type: Sequelize.GEOMETRY("MULTIPOLYGON", 4326),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("tbl_geo_wilayah", ["geom"], {
      name: "tbl_geo_wilayah_geom_gist",
      using: "gist",
    });
    await queryInterface.addIndex("tbl_geo_wilayah", ["kode_provinsi"]);
    await queryInterface.addIndex("tbl_geo_wilayah", ["kode_kabupaten"]);
    await queryInterface.addIndex("tbl_geo_wilayah", ["kode_kecamatan"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tbl_geo_wilayah");
  },
};