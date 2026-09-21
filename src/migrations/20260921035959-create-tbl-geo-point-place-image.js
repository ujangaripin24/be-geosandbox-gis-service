'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tbl_geo_point_place_image', {
      uuid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid_place: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tbl_geo_point_place',
          key: 'uuid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      link_img: {
        type: Sequelize.STRING(500),
        allowNull: false,
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
    await queryInterface.addIndex('tbl_geo_point_place_image', ['uuid_place']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tbl_geo_point_place_image');
  }
};