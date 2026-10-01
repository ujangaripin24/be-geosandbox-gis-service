'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tbl_project_geo', {
      uuid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      detail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      uuid_folder: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tbl_folder_project',
          key: 'uuid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      uuid_user: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tbl_users',
          key: 'uuid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      kode_provinsi: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nama_provinsi: {
        type: Sequelize.STRING,
        allowNull: true
      },
      kode_kabupaten: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nama_kabupaten: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tbl_project_geo');
  }
};
