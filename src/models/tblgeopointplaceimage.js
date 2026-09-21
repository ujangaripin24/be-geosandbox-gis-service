'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TblGeoPointPlaceImage extends Model {
    static associate(models) {
      TblGeoPointPlaceImage.belongsTo(models.TblPointPlace, {
        foreignKey: "uuid_place",
        as: "place",
      });
    }
  }
  TblGeoPointPlaceImage.init(
    {
      uuid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      uuid_place: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      link_img: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "TblGeoPointPlaceImage",
      tableName: "tbl_geo_point_place_image",
      timestamps: true,
    },
  );
  return TblGeoPointPlaceImage;
};