"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TblMultiGeom extends Model {
    static associate(models) {
      TblMultiGeom.belongsTo(models.DetailUsers, {
        foreignKey: "uuid_user",
        targetKey: "uuid",
        as: "user",
      });
    }
  }

  TblMultiGeom.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      detail: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      uuid_user: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tbl_users",
          key: "uuid",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      geom: {
        type: DataTypes.GEOMETRY("GEOMETRY", 4326),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "TblMultiGeom",
      tableName: "tbl_multi_geom",
      timestamps: true,
    },
  );

  return TblMultiGeom;
};
