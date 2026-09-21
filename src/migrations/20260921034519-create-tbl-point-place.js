"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS postgis;",
    );

    await queryInterface.createTable("tbl_geo_point_place", {
      uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name_place: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      geom: {
        type: Sequelize.GEOMETRY("POINT", 4326),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("tbl_geo_point_place", ["geom"], {
      name: "tbl_geo_point_place_geom_gist",
      using: "gist",
    });
    await queryInterface.addIndex("tbl_geo_point_place", ["name_place"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tbl_geo_point_place");
  },
};
