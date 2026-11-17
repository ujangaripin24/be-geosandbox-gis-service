'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('tbl_geo_point_place');

    if (!table.kode_provinsi) {
      await queryInterface.addColumn('tbl_geo_point_place', 'kode_provinsi', {
        type: Sequelize.STRING(10),
        allowNull: true,
      });
    }

    if (!table.nama_provinsi) {
      await queryInterface.addColumn('tbl_geo_point_place', 'nama_provinsi', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!table.kode_kabupaten) {
      await queryInterface.addColumn('tbl_geo_point_place', 'kode_kabupaten', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (!table.nama_kabupaten) {
      await queryInterface.addColumn('tbl_geo_point_place', 'nama_kabupaten', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!table.uuid_user) {
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
    }

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS tbl_geo_point_place_kode_provinsi_idx
      ON tbl_geo_point_place (kode_provinsi);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS tbl_geo_point_place_kode_kabupaten_idx
      ON tbl_geo_point_place (kode_kabupaten);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS tbl_geo_point_place_kode_kabupaten_idx;
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS tbl_geo_point_place_kode_provinsi_idx;
    `);

    const table = await queryInterface.describeTable('tbl_geo_point_place');
    if (table.uuid_user) {
      await queryInterface.removeColumn('tbl_geo_point_place', 'uuid_user');
    }
    if (table.nama_kabupaten) {
      await queryInterface.removeColumn('tbl_geo_point_place', 'nama_kabupaten');
    }
    if (table.kode_kabupaten) {
      await queryInterface.removeColumn('tbl_geo_point_place', 'kode_kabupaten');
    }
    if (table.nama_provinsi) {
      await queryInterface.removeColumn('tbl_geo_point_place', 'nama_provinsi');
    }
    if (table.kode_provinsi) {
      await queryInterface.removeColumn('tbl_geo_point_place', 'kode_provinsi');
    }
  }
};