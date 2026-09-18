"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS postgis;",
    );

    await queryInterface.createTable("tbl_geo_provinsi", {
      kode_provinsi: {
        type: Sequelize.STRING(2),
        allowNull: false,
        primaryKey: true,
      },
      nama_provinsi: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      geom: {
        type: Sequelize.GEOMETRY("MULTIPOLYGON", 4326),
        allowNull: false,
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

    await queryInterface.addIndex("tbl_geo_provinsi", ["geom"], {
      name: "tbl_geo_provinsi_geom_gist",
      using: "gist",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tbl_geo_provinsi");
  },
};
