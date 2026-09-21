'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tbl_geo_point_place', 'kode_provinsi', {
      type: Sequelize.STRING(10),
      allowNull: true,
    });

    await queryInterface.addColumn('tbl_geo_point_place', 'nama_provinsi', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('tbl_geo_point_place', 'kode_kabupaten', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn('tbl_geo_point_place', 'nama_kabupaten', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('tbl_geo_point_place', 'uuid_user', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tbl_users',
        key: 'uuid',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('tbl_geo_point_place', ['kode_provinsi'], {
      name: 'tbl_geo_point_place_kode_provinsi_idx',
    });

    await queryInterface.addIndex('tbl_geo_point_place', ['kode_kabupaten'], {
      name: 'tbl_geo_point_place_kode_kabupaten_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tbl_geo_point_place', 'tbl_geo_point_place_kode_kabupaten_idx');
    await queryInterface.removeIndex('tbl_geo_point_place', 'tbl_geo_point_place_kode_provinsi_idx');
    await queryInterface.removeColumn('tbl_geo_point_place', 'uuid_user');
    await queryInterface.removeColumn('tbl_geo_point_place', 'nama_kabupaten');
    await queryInterface.removeColumn('tbl_geo_point_place', 'kode_kabupaten');
    await queryInterface.removeColumn('tbl_geo_point_place', 'nama_provinsi');
    await queryInterface.removeColumn('tbl_geo_point_place', 'kode_provinsi');
  }
};