"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TblMultiGeom extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      detail: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      uuid_user: {
        type: DataTypes.UUID,
        allowNull: true,
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
    },
  );
  return TblMultiGeom;
};
