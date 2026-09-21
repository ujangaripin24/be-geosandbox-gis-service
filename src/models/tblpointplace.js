"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TblPointPlace extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TblPointPlace.hasMany(models.TblGeoPointPlaceImage, {
        foreignKey: "uuid_place",
        as: "images",
      });
    }
  }
  TblPointPlace.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name_place: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      geom: {
        type: DataTypes.GEOMETRY("POINT", 4326),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "TblPointPlace",
      tableName: "tbl_geo_point_place",
      timestamps: true,
    },
  );
  return TblPointPlace;
};
