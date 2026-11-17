"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("tbl_users");

    if (!table.uuid_company) {
      await queryInterface.addColumn("tbl_users", "uuid_company", {
        type: Sequelize.UUID,
        allowNull: true,
      });
    } else {
      await queryInterface.sequelize.query(`
        ALTER TABLE "tbl_users" 
        ALTER COLUMN "uuid_company" TYPE UUID USING "uuid_company"::uuid;
      `);
    }

    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tbl_users'
        AND constraint_name = 'fk_tbl_users_uuid_company';
    `);

    if (constraints.length === 0) {
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
    }
  },

  async down(queryInterface, Sequelize) {
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tbl_users'
        AND constraint_name = 'fk_tbl_users_uuid_company';
    `);

    if (constraints.length > 0) {
      await queryInterface.removeConstraint(
        "tbl_users",
        "fk_tbl_users_uuid_company",
      );
    }

    const table = await queryInterface.describeTable("tbl_users");
    if (table.uuid_company) {
      await queryInterface.changeColumn("tbl_users", "uuid_company", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },
};
