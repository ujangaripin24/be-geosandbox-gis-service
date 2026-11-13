'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "tbl_users" 
      ALTER COLUMN "uuid_company" TYPE UUID USING "uuid_company"::uuid;
    `);

    await queryInterface.addConstraint("tbl_users", {
      type: "foreign key",
      fields: ["uuid_company"],
      name: "fk_tbl_users_uuid_company",
      references: {
        table: "tbl_companies",
        field: "uuid",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "tbl_users",
      "fk_tbl_users_uuid_company"
    );

    await queryInterface.changeColumn("tbl_users", "uuid_company", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
