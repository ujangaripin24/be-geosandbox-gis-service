'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tbl_geometry_project', {
      uuid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      detail: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uuid_project_geo: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tbl_project_geo',
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
      geom: {
        type: Sequelize.GEOMETRY('GEOMETRY', 4326),
        allowNull: false
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

    // Create spatial index for performance
    await queryInterface.addIndex('tbl_geometry_project', ['geom'], {
      using: 'gist',
      name: 'idx_tbl_geometry_project_geom'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tbl_geometry_project');
  }
};
