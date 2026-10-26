'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menambahkan composite soft unique index: LOWER(TRIM(name_place)) + kode_kabupaten
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_point_place_soft_unique 
      ON tbl_geo_point_place (LOWER(TRIM(name_place)), kode_kabupaten);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_point_place_soft_unique;
    `);
  }
};
